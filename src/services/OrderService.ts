import { Currency } from '@/data-model/_common/currency';
import { USDC } from '@/data-model/_common/currency/USDC';
import { Unsaved, UUID } from '@/data-model/_common/type/CommonType';
import {
  deriveOrderStatusFromSquareOrderFulfillmentState,
  deriveOrderStatusFromSquareOrderState,
  mapOrderToSquareOrder,
} from '@/data-model/_external/data-sources/square/SquareDTO';
import { Cart } from '@/data-model/cart/CartType';
import {
  createExternalOrderInfo,
  mapCartToNewOrder,
} from '@/data-model/order/OrderDTO';
import {
  ErroredOrder,
  ExternalOrderInfo,
  InProgressOrder,
  NewOrder,
  Order,
  OrderStatus,
} from '@/data-model/order/OrderType';
import {
  Shop,
  ShopSourceConfig,
  SquareShopSourceConfig,
} from '@/data-model/shop/ShopType';
import {
  BaseEffectError,
  genericError,
  GenericError,
  NotFoundError,
  OnChainExecutionError,
  SQLExecutionError,
  UnimplementedPathError,
} from '@/lib/effect/errors';
import {
  BASE_CLIENT,
  BASE_RPC_CONFIG,
  getRPCConfig,
  mapChainIdToViemChain,
} from '@/lib/ethereum';
import { generateUUID, rehydrateData } from '@/lib/utils';
import { PayRequest } from '@/pages/api/orders/pay';
import { sql } from '@vercel/postgres';
import { differenceInMinutes } from 'date-fns';
import { Effect, Fiber, pipe } from 'effect';
import { UnknownException } from 'effect/Cause';
import {
  all,
  andThen,
  catchTag,
  fail,
  flatMap,
  map,
  succeed,
  tryPromise,
} from 'effect/Effect';
import { Address, createWalletClient, Hash, Hex } from 'viem';
import { getTransactionReceipt } from 'viem/actions';
import ShopService from './ShopService';
import { SquareService, SquareServiceError } from './SquareService';
import {
  getSqaureExternalId,
  mapShopSourceConfigToExternalId,
} from '@/data-model/shop/ShopDTO';
import { ChainId, USDCAuthorization } from '@/data-model/ethereum/EthereumType';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import { privateKeyToAccount } from 'viem/accounts';
import { getDripRelayerPrivateKey } from '@/lib/constants';

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
      "externalOrderInfo"
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
      ${JSON.stringify(order.externalOrderInfo)}
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
      "externalOrderInfo" = EXCLUDED."externalOrderInfo"
    RETURNING *
  `.then(
    r => /* rehydrate any currency objects*/ rehydrateData(r.rows[0]) as T,
  );
};

// const update = async (
//   orderId: UUID,
//   operations: UpdateOrderOperation[],
// ): Promise<Order | null> => {
//   const result = await sql`
//     SELECT
//     o.*,
//     (
//       SELECT json_agg(s.*)
//       FROM shops s
//       WHERE s.id = o.shop
//       LIMIT 1
//     ) AS relatedshop
//     FROM orders o
//     WHERE o.id = ${orderId}
//   `;
//   if (!result.rowCount) throw Error('Order not found');

//   const { relatedshop, ...order } = result.rows[0] as Order & {
//     relatedshop: Shop[];
//   };
//   const shop = relatedshop[0];

//   if (order.status !== '1-pending')
//     throw Error('Cannot update an order that is not pending');

//   for (const op of operations) {
//     let orderItemId: number;

//     switch (op.__type) {
//       case 'add':
//         if (Array.isArray(op.orderItem))
//           order.orderItems = [
//             ...order.orderItems,
//             ...op.orderItem.map<OrderItem>(o => ({ id: v4() as UUID, ...o })),
//           ];
//         else order.orderItems.push({ id: v4() as UUID, ...op.orderItem });
//         break;
//       case 'delete':
//         orderItemId = order.orderItems.findIndex(o => o.id === op.orderItemId);
//         if (orderItemId === -1) break;
//         order.orderItems.splice(orderItemId, 1);
//         break;
//       case 'update':
//         orderItemId = order.orderItems.findIndex(o => o.id === op.orderItemId);
//         if (orderItemId === -1) throw Error('bad order id');
//         order.orderItems[orderItemId] = op.orderItem;
//         break;
//       case 'tip':
//         if (shop.tipConfig.enabled === false)
//           throw Error('tipping is disabled');

//         order.tip = op.tip
//           ? {
//               ...op.tip,
//               address: shop.tipConfig.address,
//             }
//           : null;
//         break;
//       default:
//         let _err: never;
//         throw Error('bad impl');
//     }
//   }

//   if (order.orderItems.length === 0) {
//     await deleteOrder(orderId);
//     return null;
//   }

//   await sql`
//     UPDATE orders
//     SET
//     "orderItems" = ${JSON.stringify(order.orderItems)},
//     "tip" = ${order.tip ? JSON.stringify(order.tip) : null}
//     WHERE id = ${orderId}
//   `;

//   return order;
// };

export class USDCWithdrawalSimulationError extends BaseEffectError {
  readonly _tag = 'USDCWithdrawalSimulationError';
}

const simulateUSDCWithdrawal = (
  authorization: USDCAuthorization,
): Effect.Effect<boolean, USDCWithdrawalSimulationError> => {
  return tryPromise({
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

const payForOrderViaUSDCAuthorization = (
  chainId: ChainId,
  order: Unsaved<NewOrder>,
  authorization: USDCAuthorization,
): Effect.Effect<
  { txHash: Hex; amount: bigint; to: Address },
  OnChainExecutionError
> => {
  return pipe(
    { chainId, order, authorization },
    ({ authorization, chainId, order }) => ({
      relayer: createWalletClient({
        ...getRPCConfig(chainId),
        name: 'Drip Relayer Client',
        account: privateKeyToAccount(`0x${getDripRelayerPrivateKey()}`),
      }),
      usdcConfig: USDC_CONFIG[ChainId.BASE],
      authorization,
      order,
    }),
    ({
      relayer,
      authorization: {
        from,
        to,
        nonce,
        signature,
        validAfter,
        validBefore,
        value,
      },
      usdcConfig,
    }) =>
      tryPromise({
        try: async () =>
          await relayer.writeContract({
            abi: usdcConfig.abi,
            chain: mapChainIdToViemChain(chainId),
            address: usdcConfig.address,
            functionName: 'transferWithAuthorization',
            args: [from, to, value, validAfter, validBefore, nonce, signature],
          }),
        catch: e => new OnChainExecutionError(e),
      }),
    andThen(txHash => ({
      txHash,
      amount: authorization.value,
      to: authorization.to,
    })),
  );
  // return pipe(
  //   // load the shop config
  //   tryPromise({
  //     try: async () =>
  //       await ShopService.findShopConfigByExternalId(
  //         mapShopSourceConfigToExternalId(shopSourceConfig),
  //       ).then(
  //         s =>
  //           s ||
  //           (function () {
  //             throw new NotFoundError('Shop not found');
  //           })(),
  //       ),
  //     catch: e => new SQLExecutionError(e),
  //   }),
  //   flatMap(shopConfig => {
  //     if (!('fundRecipientConfig' in shopConfig) || !shopConfig.fundRecipientConfig)
  //       return fail(new UnimplementedPathError('Shop tip config not found'));
  //     // TODO here:
  //     const recipient = shopConfig.fundRecipientConfig.recipient;
  //     return succeed({ txHash: '0x1234', amountPaid: amountToXfer });
  //   }),
  // );
};

const addExternalOrderInfo = async (
  orderId: UUID,
  data: ExternalOrderInfo,
): Promise<Order> => {
  const query = await sql`
    SELECT orders.*, shops."__sourceConfig"
    FROM orders
    JOIN shops ON orders.shop = shops.id
    WHERE orders.id = ${orderId}
  `;

  const order = query.rows[0] as Order & {
    __sourceConfig: Shop['__sourceConfig'];
  };

  if (!order) throw Error('Order not found');

  const externalOrderInfo = createExternalOrderInfo(order.__sourceConfig, {
    ...order.externalOrderInfo,
    ...data,
  });

  const result = await sql`UPDATE orders
    SET
    "externalOrderInfo" = ${JSON.stringify(externalOrderInfo)}
    WHERE id = ${orderId}
    RETURNING *
  `;
  const o = result.rows[0];
  return o as Order;
};

// async function _syncSliceOrder(order: InProgressOrder) {
//   const timeSince = differenceInMinutes(new Date(), new Date(order.timestamp));
//   const itsBeen5Minutes = timeSince > 5;

//   const sliceOrders = await sliceKit
//     .getOrder({
//       transactionHash: order.transactionHash,
//     })
//     .then(o => o.order.slicerOrders)
//     .catch(e => {
//       throw Error(`Error fetching order from slice: ${e}`);
//     });
//   if (!sliceOrders.length) throw Error('slice order not found');
//   const [sliceOrder] = sliceOrders;
//   const orderNumber = sliceOrder.refOrderId;
//   const status: SliceOrderStatus = sliceOrder.status;
//   const newOrderStatus: Order['status'] =
//     status === 'Completed' || itsBeen5Minutes
//       ? '4-complete'
//       : status === 'Canceled'
//         ? 'cancelled'
//         : order.status;

//   const result = await sql`UPDATE
//         orders
//         SET "externalOrderInfo" = ${JSON.stringify({
//           ...order.externalOrderInfo!,
//           orderNumber,
//           status: newOrderStatus,
//         })},
//       "status" = ${newOrderStatus}
//       WHERE id = ${order.id}
//       RETURNING *`;

//   return result.rows[0] as PaidOrder;
// }

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

  const squreOrderStatus = deriveOrderStatusFromSquareOrderFulfillmentState(
    squareOrder.fulfillments?.[0]?.state,
  );

  const newOrderStatus =
    // override the order status if it's been a while
    squreOrderStatus === '2-in-progress' && itsBeen5Minutes
      ? '4-complete'
      : squreOrderStatus;

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

  return result.rows[0] as InProgressOrder;
}

const syncOrderWithExternalService = async (
  order: InProgressOrder,
): Promise<InProgressOrder> => {
  if (!order.externalOrderInfo) throw Error('externalOrderInfo not found');

  if (order.externalOrderInfo.__type === 'slice')
    throw Error('slice not implemented');
  // return await _syncSliceOrder(order);
  else if (order.externalOrderInfo.__type === 'square')
    return await _syncSquareOrder(order);

  let _type: never = order.externalOrderInfo;
  throw Error(`${_type} not implemented`);
};

const _payForSliceOrder = ({
  orderId,
  transactionHash,
}: {
  orderId: UUID;
  transactionHash: Hash;
}) => {
  const pipeline = pipe(
    // pipe over the order id
    orderId,
    // query for the order
    orderId =>
      tryPromise({
        try: () => findById(orderId),
        catch: e => new SQLExecutionError(String(e)),
      }),
    // assert the order exists
    flatMap(o => (o ? succeed(o) : fail(new NotFoundError('Order not found')))),
    // add the paid prices to the object
    map<Order, NewOrder>(o => ({
      ...o,
      payments: [{ __type: 'onchain', amount: USDC.ZERO, transactionHash }],
      status: '1-submitting',
    })),
    // update the order
    flatMap(o =>
      tryPromise({
        try: () =>
          sql`UPDATE orders
          SET
          "payments" = ${JSON.stringify(o.payments)},
          "status" = ${o.status}
          WHERE id = ${orderId}
          RETURNING *
        `.then(
            r =>
              (r.rows[0] as Order) ||
              new NotFoundError('Order not returned properly'),
          ),
        catch: e => new SQLExecutionError(String(e)),
      }),
    ),
  );

  return pipeline;
};

function _payForSquareOrder({
  usdcAuthorization,
  cart,
}: {
  usdcAuthorization: USDCAuthorization;
  cart: Cart;
}): Effect.Effect<
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
    cart,
    // load the shops tip recipient data if there's a tip
    cart =>
      all([
        succeed({ cart, usdcAuthorization }),
        tryPromise({
          try: async () =>
            await ShopService.findById(cart.shop).then(
              s =>
                (s as Shop<'square'>) ||
                (function () {
                  throw new NotFoundError('Shop not found');
                })(),
            ),
          catch: e => new SQLExecutionError(e),
        }),
      ]),
    // map the cart to a new order
    map(([{ cart, usdcAuthorization }, shop]) => ({
      newOrder: mapCartToNewOrder({
        cart,
        tipRecipient: shop.tipConfig.recipient,
      }),
      shop,
      cart,
      usdcAuthorization,
    })),
    andThen(({ newOrder, shop, cart, usdcAuthorization }) =>
      all([
        succeed({ newOrder, shop, cart }),
        // try and simulate the withdrawal
        simulateUSDCWithdrawal(usdcAuthorization),
        // if it passes, run the withdraw on a new thread
        Effect.fork(
          payForOrderViaUSDCAuthorization(
            ChainId.BASE,
            newOrder,
            usdcAuthorization,
          ),
        ),
      ]),
    ),
    // save the order
    andThen(([{ shop, newOrder }, _simulationSuccess, usdcWithdrawalFiber]) =>
      all(
        [
          succeed({ shop, cart }),
          tryPromise({
            try: () =>
              save(newOrder).then(savedOrder => {
                savedOrderId = savedOrder.id;
                return savedOrder;
              }),
            catch: e => new SQLExecutionError(e),
          }),
          // reconcile the fiber
          usdcWithdrawalFiber,
        ],
        { concurrency: 'unbounded' },
      ),
    ),
    andThen(([{ shop }, savedOrder, paymentDetails]) => {
      return {
        shop,
        order: savedOrder,
        squareOrder: mapOrderToSquareOrder(shop, savedOrder),
        paymentDetails,
      };
    }),
    andThen(({ order, shop, squareOrder, paymentDetails }) =>
      all(
        [
          succeed({ shop, order, squareOrder }),
          // create the order in square
          tryPromise({
            try: () =>
              SquareService.createOrder(
                shop.__sourceConfig.merchantId,
                squareOrder,
              ),
            catch: e => new SquareServiceError(e),
          }),
          // update the order to include the payment
          tryPromise({
            try: () =>
              save({
                ...order,
                payments: [
                  ...order.payments,
                  {
                    __type: 'onchain',
                    amount: paymentDetails.amount,
                    transactionHash: paymentDetails.txHash,
                  },
                ],
              }).then(savedOrder => {
                savedOrderId = savedOrder.id;
                return savedOrder;
              }),
            catch: e => new SQLExecutionError(e),
          }),
        ],
        { concurrency: 'unbounded' },
      ),
    ),
    // update the order object
    andThen(([{ shop, order }, createdSquareOrder]) => {
      const externalOrderInfo = {
        __type: 'square',
        orderId:
          createdSquareOrder.id ||
          genericError('Square order id not present in createOrder response'),
        orderNumber: createdSquareOrder.ticketName || '',
        status: deriveOrderStatusFromSquareOrderState(createdSquareOrder.state),
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
    andThen(({ order, shop }) =>
      all(
        [
          // save the updated order in the sql db
          tryPromise({
            try: () => save<InProgressOrder>(order),
            catch: e => new SQLExecutionError(e),
          }),
          // pay for the order using type "EXTERNAL"
          tryPromise({
            try: async () =>
              SquareService.payForOrder({
                merchantId: shop.__sourceConfig.merchantId,
                locationId: shop.__sourceConfig.locationId,
                order,
              }),
            catch: e => new SquareServiceError(e),
          }),
        ],
        { concurrency: 2 },
      ),
    ),
    // return out the order
    andThen(([order]) => order),

    // error handling
    catchTag('SquareServiceError', squareServiceError =>
      tryPromise({
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
    catchTag('USDCWithdrawalSimulationError', err => {
      console.error(err);
      return fail(new OnChainExecutionError('Fund transfer failed'));
    }),
  );

  return pipeline;
}

const pay = (
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
  if (params.type === 'slice') return _payForSliceOrder(params);
  if (params.type === 'square') return _payForSquareOrder(params);

  let _type: never = params;
  return Effect.fail(new UnimplementedPathError(`${_type} not implemented`));
};

const syncWithExternalService = async (orderIds: UUID[]): Promise<Order[]> => {
  const result = await sql.query(
    `SELECT * FROM orders WHERE id IN (${orderIds.map((_, i) => `$${i + 1}`)})`,
    orderIds,
  );

  const orders = result.rows.filter(
    o => 'externalOrderInfo' in o && o.status === '2-in-progress',
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
  // update,
  pay,
  addExternalOrderInfo,
  syncWithExternalService,
  checkStatus,
  delete: deleteOrder,
  clear,
  getOrdersByUserId,
  migrate,
};

export default orderService;
