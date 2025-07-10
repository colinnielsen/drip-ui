import { Currency } from '@/data-model/_common/currency';
import {
  addCurrencies,
  initCurrencyFromType,
  subCurrencies,
} from '@/data-model/_common/currency/currencyDTO';
import { USDC } from '@/data-model/_common/currency/USDC';
import { Unsaved, UUID } from '@/data-model/_common/type/CommonType';
import {
  mapOrderToSquareOrder,
  mapSquareOrderFulfillmentStateToOrderStatus,
  mapSquareOrderStateToOrderStatus,
} from '@/data-model/_external/data-sources/square/SquareDTO';
import { Cart } from '@/data-model/cart/CartType';
import { mapEthAddressToAddress } from '@/data-model/ethereum/EthereumDTO';
import {
  ChainId,
  EthAddress,
  USDCAuthorization,
} from '@/data-model/ethereum/EthereumType';
import { mapCartToNewOrder, needsSyncing } from '@/data-model/order/OrderDTO';
import {
  CompletedOrder,
  ErroredOrder,
  ExternalOrderInfo,
  InProgressOrder,
  Order,
  OrderStatus,
  PaymentInfo,
  RewardTokenDistribution,
} from '@/data-model/order/OrderType';
import { Shop, SquareShopSourceConfig } from '@/data-model/shop/ShopType';
import { User } from '@/data-model/user/UserType';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import { sliceKit } from '@/lib/data-sources/slice';
import { existsOrNotFoundErr } from '@/lib/effect';
import {
  BaseEffectError,
  genericError,
  GenericError,
  NotFoundError,
  OnChainExecutionError,
  SQLExecutionError,
  unexpected,
  UnimplementedPathError,
} from '@/lib/effect/errors';
import {
  BASE_CLIENT,
  getDripRelayerClient,
  mapChainIdToViemChain,
} from '@/lib/ethereum';
import { generateUUID, rehydrateData } from '@/lib/utils';
import { PayRequest } from '@/pages/api/orders/pay';
import { sql } from '@vercel/postgres';
import { differenceInMinutes } from 'date-fns';
import { Console, Effect, pipe } from 'effect';
import { type UnknownException } from 'effect/Cause';
import { Address, Hash, Hex } from 'viem';
import { getTransactionReceipt } from 'viem/actions';
import { EffectfulRewardService } from './RewardService';
import { effectfulShopService } from './ShopService';
import { SquareService, SquareServiceError } from './SquareService';

// export type UpdateOrderOperation =
//   | { __type: 'add'; orderItem: Unsaved<OrderItem> | Unsaved<OrderItem>[] }
//   | { __type: 'tip'; tip: ({ amount: USDC } & Partial<Order['tip']>) | null }
//   | { __type: 'delete'; orderItemId: UUID }
//   | { __type: 'update'; orderItemId: UUID; orderItem: OrderItem };

const findById = async (id: UUID): Promise<Order | null> => {
  const result = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return result.rows[0] as Order | null;
};

const save = async <T extends Order>(
  unsavedOrder: Unsaved<T> | T,
): Promise<T> => {
  const order = {
    ...unsavedOrder,
    id: 'id' in unsavedOrder ? unsavedOrder.id : generateUUID(),
  } as T;

  return sql`
    INSERT INTO orders
    (
      id,
      timestamp,
      shop,
      "user",
      "lineItems",
      "discounts",
      "tip",
      "subtotal",
      "taxAmount",
      "discountAmount",
      "totalAmount",
      "status",
      "payments",
      "externalOrderInfo",
      "additionalDistributions"
    )
    VALUES (
      ${order.id},
      ${order.timestamp.toISOString()},
      ${order.shop},
      ${order.user},
      ${JSON.stringify(order.lineItems)},
      ${JSON.stringify(order.discounts)},
      ${JSON.stringify(order.tip)},
      ${JSON.stringify(order.subtotal)},
      ${JSON.stringify(order.taxAmount)},
      ${JSON.stringify(order.discountAmount)},
      ${JSON.stringify(order.totalAmount)},
      ${order.status},
      ${JSON.stringify(order.payments)},
      ${JSON.stringify(order.externalOrderInfo)},
      ${JSON.stringify(order.additionalDistributions)}
    )
    ON CONFLICT (id) DO UPDATE SET
      "timestamp" = EXCLUDED."timestamp",
      "shop" = EXCLUDED."shop",
      "user" = EXCLUDED."user",
      "lineItems" = EXCLUDED."lineItems",
      "discounts" = EXCLUDED."discounts",
      "tip" = EXCLUDED."tip",
      "subtotal" = EXCLUDED."subtotal",
      "taxAmount" = EXCLUDED."taxAmount",
      "discountAmount" = EXCLUDED."discountAmount",
      "totalAmount" = EXCLUDED."totalAmount",
      "status" = EXCLUDED."status",
      "payments" = EXCLUDED."payments",
      "externalOrderInfo" = EXCLUDED."externalOrderInfo",
      "additionalDistributions" = EXCLUDED."additionalDistributions"
    RETURNING *
  `.then(
    r => /* rehydrate any currency objects*/ rehydrateData(r.rows[0]) as T,
  );
};

const saveEffect = <T extends Order>(
  order: T | Unsaved<T>,
): Effect.Effect<T, SQLExecutionError> =>
  Effect.tryPromise({
    try: async () => await save(order),
    catch: e => new SQLExecutionError(e),
  });

export class USDCWithdrawalSimulationError extends BaseEffectError {
  readonly _tag = 'USDCWithdrawalSimulationError';
}

const simulateUSDCWithdrawal = (
  authorization: USDCAuthorization,
): Effect.Effect<true, USDCWithdrawalSimulationError> => {
  return Effect.tryPromise({
    try: async () =>
      await BASE_CLIENT.simulateContract({
        address: USDC_CONFIG[ChainId.BASE].address,
        abi: USDC_CONFIG[ChainId.BASE].abi,
        functionName: 'transferWithAuthorization',
        args: [
          authorization.from,
          authorization.to,
          authorization.value,
          authorization.validAfter,
          authorization.validBefore,
          authorization.nonce,
          authorization.signature,
        ],
      }).then(() => true),
    catch: e => new USDCWithdrawalSimulationError(e),
  });
};

class FundSplitTransferError extends BaseEffectError {
  readonly _tag = 'FundSplitTransferError';
}

const payForOrderViaUSDCAuthorization = ({
  chainId,
  order,
  authorization,
  orderRecipient,
}: {
  chainId: ChainId;
  order: Order;
  authorization: USDCAuthorization;
  orderRecipient: EthAddress;
}): Effect.Effect<
  { txHash: Hex; amount: Currency; to: Address },
  OnChainExecutionError
> => {
  const relayer = getDripRelayerClient(chainId);

  const tipAmount = order.tip?.amount || USDC.ZERO;
  const totalMinusTip = subCurrencies(order.totalAmount, tipAmount);
  const usdcConfig = USDC_CONFIG[ChainId.BASE];

  if (
    !addCurrencies(tipAmount, totalMinusTip).eq(
      USDC.fromWei(authorization.value),
    )
  ) {
    throw new OnChainExecutionError(
      'tip amount and total minus tip do not add up to the order total',
    );
  }

  return pipe(
    Effect.all([
      Effect.tryPromise({
        try: async () => {
          console.log('sending transferWithAuthorization');
          return await relayer
            .writeContract({
              abi: usdcConfig.abi,
              chain: mapChainIdToViemChain(chainId),
              address: usdcConfig.address,
              functionName: 'transferWithAuthorization',
              args: [
                authorization.from,
                authorization.to,
                authorization.value,
                authorization.validAfter,
                authorization.validBefore,
                authorization.nonce,
                authorization.signature,
              ],
            })
            .then(async tx => {
              console.log('waiting for transaction receipt');
              return relayer
                .waitForTransactionReceipt({ hash: tx })
                .catch(e => {
                  throw new OnChainExecutionError(
                    `failed to wait for transaction receipt: ${e.message}`,
                  );
                });
            });
        },
        catch: e => new OnChainExecutionError(e),
      }),
      Effect.all(
        [
          order.tip
            ? Effect.tryPromise({
                try: async () => {
                  console.log('sending tip txs');
                  return await relayer.writeContract({
                    abi: usdcConfig.abi,
                    chain: mapChainIdToViemChain(chainId),
                    address: usdcConfig.address,
                    functionName: 'transfer',
                    args: [
                      mapEthAddressToAddress(order.tip!.recipient),
                      order.tip!.amount.wei,
                    ],
                  });
                },
                catch: e => new FundSplitTransferError(e),
              })
            : Effect.succeed(null),
          Effect.tryPromise({
            try: async () => {
              console.log('sending shop xfer txs');
              return await relayer.writeContract({
                abi: usdcConfig.abi,
                chain: mapChainIdToViemChain(chainId),
                address: usdcConfig.address,
                functionName: 'transfer',
                args: [
                  mapEthAddressToAddress(orderRecipient),
                  totalMinusTip.wei,
                ],
              });
            },
            catch: e => new FundSplitTransferError(e),
          }),
        ],
        { concurrency: 'unbounded' },
      ),
    ]),
    Effect.andThen(([receipt]) => {
      console.log('finished xfers 🎉');
      return {
        txHash: receipt.transactionHash,
        amount: initCurrencyFromType(
          order.totalAmount['__currencyType'],
          authorization.value,
        ),
        to: authorization.to,
      };
    }),
    Effect.catchTag('FundSplitTransferError', e =>
      pipe(
        e,
        e =>
          Effect.all([
            Effect.succeed(e),
            Effect.tryPromise({
              try: async () =>
                await relayer.writeContract({
                  abi: usdcConfig.abi,
                  chain: mapChainIdToViemChain(chainId),
                  address: usdcConfig.address,
                  functionName: 'transfer',
                  args: [authorization.from, authorization.value],
                }),
              catch: e => new OnChainExecutionError(e),
            }),
          ]),
        Effect.andThen(([e]) =>
          Effect.fail(
            new OnChainExecutionError(
              `failed but returned funds back to sender: \n original error: ${e.message}`,
            ),
          ),
        ),
      ),
    ),
  );
};

const distributeOrderRewards = (
  order: Order,
): Effect.Effect<
  Order,
  GenericError | UnknownException | SQLExecutionError
> => {
  const pipeline = pipe(
    EffectfulRewardService.triggerOrderCompletionReward(order),
    Effect.andThen(({ rewardAmount, sent }) => {
      if (!sent) return Effect.succeed(order);

      const rewardDistribution: RewardTokenDistribution = {
        __type: 'reward-token-distribution',
        recipient: order.user,
        tokenAmount: rewardAmount,
      };

      const orderWithReward = {
        ...order,
        additionalDistributions: [
          ...(order.additionalDistributions || []),
          rewardDistribution,
        ],
      };

      console.log('orderWithReward', orderWithReward);

      return saveEffect(orderWithReward);
    }),
  );

  return pipeline;
};

async function _syncSliceOrder(order: InProgressOrder) {
  const timeSince = differenceInMinutes(new Date(), new Date(order.timestamp));
  const itsBeen5Minutes = timeSince > 5;

  const transactionHash = order.payments?.[0]?.transactionHash;
  if (!transactionHash)
    throw Error(`Transaction hash not found for order ${order.id}`);

  // Fetch the latest status from Slice
  const { order: sliceOrderData } = await sliceKit
    .getOrder({ transactionHash })
    .catch(e => {
      throw Error(`Error fetching order from slice: ${e}`);
    });

  const sliceOrders = sliceOrderData?.slicerOrders ?? [];
  if (!sliceOrders.length) throw Error('slice order not found');

  const [sliceOrder] = sliceOrders;
  const { status } = sliceOrder;

  // Determine new status based on Slice and time elapsed
  const newOrderStatus: Order['status'] =
    status === 'Completed' || (needsSyncing(order) && itsBeen5Minutes)
      ? '3-complete'
      : status === 'Canceled'
        ? 'cancelled'
        : order.status;

  const result = await sql`UPDATE
        orders
        SET "externalOrderInfo" = ${JSON.stringify({
          ...order.externalOrderInfo!,
          status: newOrderStatus,
        })},
        "status" = ${newOrderStatus}
      WHERE id = ${order.id}
      RETURNING *`;

  let updatedOrder = result.rows[0] as InProgressOrder | CompletedOrder;

  return updatedOrder;
}

async function _syncSquareOrder(order: InProgressOrder) {
  const timeSince = differenceInMinutes(new Date(), new Date(order.timestamp));
  const itsBeen5Minutes = timeSince > 5;

  const orderId =
    order.externalOrderInfo?.orderId || genericError('Order id not found');
  const merchantId =
    await sql`SELECT "__sourceConfig" FROM shops WHERE id = ${order.shop}`
      .then(
        r =>
          (r.rows[0].__sourceConfig as SquareShopSourceConfig)?.merchantId ||
          genericError('Square source config not found'),
      )
      .catch(e => genericError(`Error fetching merchant id: ${e.message}`));

  const squareOrder = await SquareService.getOrder({
    merchantId,
    orderId,
  });

  const squreOrderStatus = mapSquareOrderFulfillmentStateToOrderStatus(
    squareOrder.fulfillments?.[0]?.state,
  );

  const newOrderStatus: Order['status'] =
    // override the order status if it's been a while
    needsSyncing(order) && itsBeen5Minutes ? '3-complete' : squreOrderStatus;

  const result = await sql`
    UPDATE
    orders
    SET
      "externalOrderInfo" = ${JSON.stringify({
        ...order.externalOrderInfo!,
        status: newOrderStatus,
      })},
      "status" = ${newOrderStatus}
    WHERE id = ${order.id}
    RETURNING *
  `;

  let updatedOrder = result.rows[0] as InProgressOrder | CompletedOrder;

  return updatedOrder;
}

const syncOrderWithExternalService = async (
  order: InProgressOrder,
): Promise<InProgressOrder | Order> => {
  if (!order.externalOrderInfo) throw Error('externalOrderInfo not found');

  if (order.externalOrderInfo.__type === 'slice')
    return await _syncSliceOrder(order);
  else if (order.externalOrderInfo.__type === 'square')
    return await _syncSquareOrder(order);

  let _type: never = order.externalOrderInfo;
  throw Error(`${_type} not implemented`);
};

const _payForSliceOrder = (
  userId: User['id'],
  {
    sliceOrderId,
    transactionHash,
    totalPaidWei,
    cart,
  }: {
    sliceOrderId: string;
    transactionHash: Hash;
    totalPaidWei: bigint;
    cart: Cart;
  },
): Effect.Effect<
  InProgressOrder,
  SQLExecutionError | NotFoundError | GenericError,
  never
> => {
  const pipeline = pipe(
    // load the shop
    effectfulShopService.findById(cart.shop).pipe(existsOrNotFoundErr),
    // map the cart to a new order
    Effect.andThen(({ tipConfig }) => {
      const externalOrderInfo = {
        __type: 'slice',
        orderId: sliceOrderId,
        // orderNumber: '',
        status: '2-in-progress',
      } satisfies ExternalOrderInfo;

      const payments = [
        {
          __type: 'onchain',
          amount: initCurrencyFromType(
            cart.quotedTotalAmount!['__currencyType'],
            totalPaidWei,
          ),
          transactionHash,
        } satisfies PaymentInfo,
      ];

      const order = {
        ...mapCartToNewOrder({
          userId,
          cart,
          tipRecipient: tipConfig.recipient,
        }),
        status: '2-in-progress',
        externalOrderInfo,
        payments,
      } satisfies Unsaved<InProgressOrder>;

      return order;
    }),
    // save the order
    Effect.andThen(order =>
      Effect.tryPromise({
        try: () => save<InProgressOrder>(order),
        catch: e => new SQLExecutionError(e),
      }),
    ),
    Effect.tap(() => Console.debug('saved order')),
  );

  return pipeline;
};

function _payForSquareOrder(
  userId: User['id'],
  {
    usdcAuthorization,
    cart,
  }: {
    usdcAuthorization: USDCAuthorization;
    cart: Cart;
  },
): Effect.Effect<
  InProgressOrder,
  | SQLExecutionError
  | NotFoundError
  | GenericError
  | OnChainExecutionError
  | SquareServiceError
  | UnknownException,
  never
> {
  let savedOrderId: UUID;

  const pipeline = pipe(
    effectfulShopService
      .findById(cart.shop)
      .pipe(
        Effect.andThen(shop =>
          shop
            ? Effect.succeed(shop as Shop<'square'>)
            : Effect.fail(new NotFoundError('Shop not found')),
        ),
      ),
    // Transform cart into a new order
    Effect.andThen(shop => ({
      unsavedOrder: mapCartToNewOrder({
        userId,
        cart,
        tipRecipient: shop.tipConfig.recipient,
      }),
      shop,
    })),
    // Simulate USDC withdrawal
    Effect.andThen(({ unsavedOrder, shop }) =>
      Effect.all([
        Effect.succeed({ unsavedOrder, shop }),
        simulateUSDCWithdrawal(usdcAuthorization).pipe(
          Effect.andThen(success => Effect.succeed(success)),
        ),
      ]),
    ),
    // Persist the order in the database
    Effect.andThen(([{ shop, unsavedOrder }]) =>
      Effect.all({
        shop: Effect.succeed(shop),
        savedOrder: saveEffect(unsavedOrder),
      }),
    ),
    // Capture the saved order ID
    Effect.tap(({ savedOrder }) => (savedOrderId = savedOrder.id)),
    // Prepare and create the order in Square
    Effect.andThen(({ shop, savedOrder }) => ({
      shop,
      order: savedOrder,
      unCreatedSquareOrder: mapOrderToSquareOrder(shop, savedOrder),
    })),
    Effect.andThen(({ order, shop, unCreatedSquareOrder }) =>
      Effect.all(
        [
          Effect.succeed({ shop, order }),
          Effect.tryPromise({
            try: () =>
              SquareService.createOrder(
                shop.__sourceConfig.merchantId,
                unCreatedSquareOrder,
              ),
            catch: e => new SquareServiceError(e),
          }),
        ],
        { concurrency: 'unbounded' },
      ),
    ),
    // Update order with external information
    Effect.andThen(([{ shop, order }, createdSquareOrder]) => {
      const externalOrderInfo = {
        __type: 'square',
        orderId:
          createdSquareOrder.id ||
          genericError('Square order id not present in createOrder response'),
        orderNumber: createdSquareOrder.ticketName || '',
        status: mapSquareOrderStateToOrderStatus(createdSquareOrder.state),
      } satisfies ExternalOrderInfo;

      const nextOrder = {
        ...order,
        status: '2-in-progress',
        externalOrderInfo,
      } satisfies InProgressOrder;

      return {
        shop,
        order: nextOrder,
      };
    }),
    Effect.tap(({ order, shop }) =>
      Effect.tryPromise({
        try: async () =>
          SquareService.payForOrder({
            merchantId: shop.__sourceConfig.merchantId,
            locationId: shop.__sourceConfig.locationId,
            order,
          }),
        catch: e => new SquareServiceError(e),
      }),
    ),
    Effect.tap(({ order }) => saveEffect(order)),
    // Update order with payment details and withdraw funds
    Effect.andThen(({ order, shop }) =>
      pipe(
        effectfulShopService
          .findShopConfigByShopId(shop.id)
          .pipe(
            Effect.andThen(shopConfig =>
              shopConfig?.__type === 'square' && shopConfig.fundRecipientConfig
                ? Effect.succeed(shopConfig)
                : Effect.fail(
                    new NotFoundError(
                      "Shop not found or doesn't have a fund recipient config",
                    ),
                  ),
            ),
          ),
        Effect.andThen(shopConfig =>
          payForOrderViaUSDCAuthorization({
            chainId: ChainId.BASE,
            order,
            authorization: usdcAuthorization,
            orderRecipient:
              shopConfig.__type === 'square'
                ? shopConfig.fundRecipientConfig!.recipient!
                : unexpected(),
          }),
        ),
        Effect.andThen(paymentDetails => {
          const nextOrder: InProgressOrder = {
            ...order,
            payments: [
              ...order.payments,
              {
                __type: 'onchain',
                amount: paymentDetails.amount,
                transactionHash: paymentDetails.txHash,
              } satisfies PaymentInfo,
            ],
          };
          return Effect.succeed(nextOrder);
        }),
        Effect.catchTag('OnChainExecutionError', e => {
          const erroredOrder: ErroredOrder = {
            ...order,
            status: 'error',
            errorDetails: {
              origin: e.originalTag || e._tag,
              message: e.message,
            },
          };
          return saveEffect(erroredOrder).pipe(() => Effect.fail(e));
        }),
      ),
    ),
    // Finalize the order
    Effect.andThen(order => saveEffect(order)),
    // Return the final order
    Effect.andThen(order => order),

    // Handle errors and update order status accordingly
    Effect.catchTag('SquareServiceError', squareServiceError =>
      Effect.tryPromise({
        try: async () => {
          const finalError = await sql`
            UPDATE orders
            SET
            "status" = ${'error' satisfies OrderStatus},
            "errorDetails" = ${JSON.stringify({
              origin: squareServiceError.originalTag || squareServiceError._tag,
              message: squareServiceError.message,
            } satisfies ErroredOrder['errorDetails'])}
            WHERE id = ${savedOrderId}
            RETURNING *
          `
            .then(() => squareServiceError)
            .catch(e => new SQLExecutionError(e));

          throw finalError;
        },
        catch: e => e as SQLExecutionError | SquareServiceError,
      }),
    ),
    Effect.catchTag('USDCWithdrawalSimulationError', err => {
      console.error(err);
      return Effect.fail(new OnChainExecutionError('Fund transfer failed'));
    }),
  );

  return pipeline;
}

const pay = (
  userId: User['id'],
  params: PayRequest,
): Effect.Effect<
  Order,
  | SQLExecutionError
  | NotFoundError
  | GenericError
  | SquareServiceError
  | UnknownException
  | OnChainExecutionError
  | UnimplementedPathError
> => {
  if (params.type === 'slice') return _payForSliceOrder(userId, params);
  if (params.type === 'square') return _payForSquareOrder(userId, params);

  let _type: never = params;
  return Effect.fail(new UnimplementedPathError(`${_type} not implemented`));
};

const syncWithExternalService = async (orderIds: UUID[]): Promise<Order[]> => {
  const result = await sql.query(
    `SELECT * FROM orders WHERE id IN (${orderIds.map((_, i) => `$${i + 1}`)})`,
    orderIds,
  );

  const orders = result.rows.filter(
    o => 'externalOrderInfo' in o && needsSyncing(o),
  ) as InProgressOrder[];
  if (!orders.length) return result.rows as Order[];

  const updatedOrders = await Promise.all(
    orders.map(async o => syncOrderWithExternalService(o)),
  );

  return updatedOrders;
};

const checkStatus = async (orderId: UUID): Promise<Order> => {
  const result = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
  const [order] = result.rows as [Order];
  if (!order) throw Error('Order not found');

  if (order.status === '1-submitting') return order;

  const txSettled = await getTransactionReceipt(BASE_CLIENT, {
    hash: order.payments?.[0]?.transactionHash,
  })
    .then(t => t.status === 'success')
    .catch(() => false);

  if (txSettled) {
    const result =
      await sql`UPDATE orders SET status = '3-in-progress' WHERE id = ${orderId} RETURNING *`;

    return result.rows[0] as Order;
  } else return order;
};

const deleteOrder = async (id: UUID): Promise<void> => {
  const result = await sql`DELETE FROM orders WHERE id = ${id}`;
  if (result.rowCount === 0) throw Error('could not delete');
};

const clear = async (orderId: UUID): Promise<Order> => {
  const result = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
  const order = result.rows[0] as Order;
  if (!order) throw Error('Order not found');

  order.lineItems = [];
  await sql`
    UPDATE orders
    SET "orderItems" = ${JSON.stringify(order.lineItems)}
    WHERE id = ${orderId}
  `;

  return order;
};

const getOrdersByUserId = async (userId: UUID): Promise<Order[]> => {
  const result = await sql`SELECT * FROM orders WHERE "user" = ${userId}`;
  return result.rows as Order[];
};

const migrate = async ({
  prevUserId,
  newUserId,
}: {
  prevUserId: UUID;
  newUserId: UUID;
}): Promise<Order[]> => {
  const result = await sql`
    UPDATE orders
    SET "user" = ${newUserId}
    WHERE "user" = ${prevUserId}`;
  return result.rows as Order[];
};

const orderService = {
  findById,
  save,
  pay,
  distributeOrderRewards,
  syncWithExternalService,
  checkStatus,
  delete: deleteOrder,
  clear,
  getOrdersByUserId,
  migrate,
};

export default orderService;
