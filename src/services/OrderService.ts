import { USDC } from '@/data-model/_common/currency/USDC';
import { Currency, Unsaved } from '@/data-model/_common/type/CommonType';
import {
  deriveOrderStatusFromSquareOrderFulfillmentState,
  deriveOrderStatusFromSquareOrderState,
  mapOrderToSquareOrder,
} from '@/data-model/_external/data-sources/square/SquareDTO';
import {
  createExternalOrderInfo,
  getOrderSummary,
  isPending,
} from '@/data-model/order/OrderDTO';
import {
  ExternalOrderInfo,
  Order,
  OrderItem,
  OrderStatus,
  PaidOrder,
} from '@/data-model/order/OrderType';
import { Shop, SquareShopSourceConfig } from '@/data-model/shop/ShopType';
import {
  genericError,
  GenericError,
  NotFoundError,
  SQLExecutionError,
  UnimplementedPathError,
} from '@/lib/effect/errors';
import { BASE_CLIENT } from '@/lib/ethereum';
import { sliceKit } from '@/lib/slice';
import { OrderStatus as SliceOrderStatus } from '@slicekit/core';
import { sql } from '@vercel/postgres';
import { UUID } from 'crypto';
import { differenceInMinutes } from 'date-fns';
import { Effect, pipe } from 'effect';
import { UnknownException } from 'effect/Cause';
import {
  andThen,
  catchTag,
  fail,
  flatMap,
  map,
  succeed,
  tap,
  tryPromise,
} from 'effect/Effect';
import { v4 } from 'uuid';
import { Hash, Hex } from 'viem';
import { getTransactionReceipt } from 'viem/actions';
import ShopService from './ShopService';
import { SquareService, SquareServiceError } from './SquareService';

export type UpdateOrderOperation =
  | { __type: 'add'; orderItem: Unsaved<OrderItem> | Unsaved<OrderItem>[] }
  | { __type: 'tip'; tip: ({ amount: USDC } & Partial<Order['tip']>) | null }
  | { __type: 'delete'; orderItemId: UUID }
  | { __type: 'update'; orderItemId: UUID; orderItem: OrderItem };

const findById = async (id: UUID): Promise<Order | null> => {
  const result = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return result.rows[0] as Order | null;
};

const save = async (
  shopId: UUID,
  userId: UUID,
  items: Unsaved<OrderItem>[],
): Promise<Order> => {
  const id = v4() as UUID;
  const orderItems = items.map(i => ({
    id: v4() as UUID,
    ...i,
  }));

  const order: Order = {
    id,
    shop: shopId,
    user: userId,
    status: '1-pending',
    timestamp: new Date().toISOString(),
    tip: null,
    orderItems,
  };

  await sql`
    INSERT INTO orders (id, shop, "user", status, timestamp, "orderItems")
    VALUES (${order.id}, ${order.shop}, ${order.user}, ${order.status}, ${order.timestamp}, ${JSON.stringify(order.orderItems)})
  `;

  return order;
};

const update = async (
  orderId: UUID,
  operations: UpdateOrderOperation[],
): Promise<Order | null> => {
  const result = await sql`
    SELECT
    o.*,
    (
      SELECT json_agg(s.*)
      FROM shops s
      WHERE s.id = o.shop
      LIMIT 1
    ) AS relatedshop
    FROM orders o
    WHERE o.id = ${orderId}
  `;
  if (!result.rowCount) throw Error('Order not found');

  const { relatedshop, ...order } = result.rows[0] as Order & {
    relatedshop: Shop[];
  };
  const shop = relatedshop[0];

  if (order.status !== '1-pending')
    throw Error('Cannot update an order that is not pending');

  for (const op of operations) {
    let orderItemId: number;

    switch (op.__type) {
      case 'add':
        if (Array.isArray(op.orderItem))
          order.orderItems = [
            ...order.orderItems,
            ...op.orderItem.map<OrderItem>(o => ({ id: v4() as UUID, ...o })),
          ];
        else order.orderItems.push({ id: v4() as UUID, ...op.orderItem });
        break;
      case 'delete':
        orderItemId = order.orderItems.findIndex(o => o.id === op.orderItemId);
        if (orderItemId === -1) break;
        order.orderItems.splice(orderItemId, 1);
        break;
      case 'update':
        orderItemId = order.orderItems.findIndex(o => o.id === op.orderItemId);
        if (orderItemId === -1) throw Error('bad order id');
        order.orderItems[orderItemId] = op.orderItem;
        break;
      case 'tip':
        if (shop.tipConfig.enabled === false)
          throw Error('tipping is disabled');

        order.tip = op.tip
          ? {
              ...op.tip,
              address: shop.tipConfig.address,
            }
          : null;
        break;
      default:
        let _err: never;
        throw Error('bad impl');
    }
  }

  if (order.orderItems.length === 0) {
    await deleteOrder(orderId);
    return null;
  }

  await sql`
    UPDATE orders
    SET
    "orderItems" = ${JSON.stringify(order.orderItems)},
    "tip" = ${order.tip ? JSON.stringify(order.tip) : null}
    WHERE id = ${orderId}
  `;

  return order;
};

const payForOrderViaUSDCAuthorization = (
  order: Order,
  signature: Hex,
): Effect.Effect<Hash, never> => {
  const amountToXfer = getOrderSummary(order).subTotal.usdc;
  // const transactionHash = await RelayService.transferUSDCWithSignature({
  //   signature,
  //   to: zeroAddress,
  //   amount: amountToXfer,
  // });
  return succeed('0x1234');
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

  if (!order || isPending(order)) throw Error('Order not found');

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

async function _syncSliceOrder(order: PaidOrder) {
  const timeSince = differenceInMinutes(new Date(), new Date(order.timestamp));
  const itsBeen5Minutes = timeSince > 5;

  const sliceOrders = await sliceKit
    .getOrder({
      transactionHash: order.transactionHash,
    })
    .then(o => o.order.slicerOrders)
    .catch(e => {
      throw Error(`Error fetching order from slice: ${e}`);
    });
  if (!sliceOrders.length) throw Error('slice order not found');
  const [sliceOrder] = sliceOrders;
  const orderNumber = sliceOrder.refOrderId;
  const status: SliceOrderStatus = sliceOrder.status;
  const newOrderStatus: Order['status'] =
    status === 'Completed' || itsBeen5Minutes
      ? '4-complete'
      : status === 'Canceled'
        ? 'cancelled'
        : order.status;

  const result = await sql`UPDATE
        orders
        SET "externalOrderInfo" = ${JSON.stringify({
          ...order.externalOrderInfo!,
          orderNumber,
          status: newOrderStatus,
        })},
      "status" = ${newOrderStatus}
      WHERE id = ${order.id}
      RETURNING *`;

  return result.rows[0] as PaidOrder;
}

async function _syncSquareOrder(order: PaidOrder) {
  const timeSince = differenceInMinutes(new Date(), new Date(order.timestamp));
  const itsBeen5Minutes = timeSince > 5;
  // debugger
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
    squreOrderStatus === '3-in-progress' && itsBeen5Minutes
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

  return result.rows[0] as PaidOrder;
}

const syncOrderWithExternalService = async (
  order: PaidOrder,
): Promise<PaidOrder> => {
  if (!order.externalOrderInfo) throw Error('externalOrderInfo not found');

  if (order.externalOrderInfo.__type === 'slice')
    return await _syncSliceOrder(order);
  else if (order.externalOrderInfo.__type === 'square')
    return await _syncSquareOrder(order);

  let _type: never = order.externalOrderInfo;
  throw Error(`${_type} not implemented`);
};

const _payForSliceOrder = ({
  orderId,
  transactionHash,
  paidPrices,
}: {
  orderId: UUID;
  transactionHash: Hash;
  paidPrices: Record<UUID, Currency>;
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
    map<Order, PaidOrder>(o => ({
      ...o,
      transactionHash,
      status: '2-submitting',
      orderItems: o.orderItems?.map<OrderItem>(o => ({
        ...o,
        paidPrice: paidPrices?.[o?.id],
      })),
    })),
    // update the order
    flatMap(o =>
      tryPromise({
        try: () =>
          sql`UPDATE orders
          SET
          "transactionHash" = ${o.transactionHash},
          "status" = ${o.status},
          "orderItems" = ${JSON.stringify(o.orderItems)}
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

// TODO: add error handling for payment and marking as paid in square
function _payForSquareOrder({
  orderId,
  signature,
  paidPrices,
}: {
  orderId: UUID;
  signature: Hex;
  paidPrices: Record<UUID, Currency>;
}): Effect.Effect<
  Order,
  | SQLExecutionError
  | NotFoundError
  | GenericError
  | SquareServiceError
  | UnknownException,
  never
> {
  const pipeline = pipe(
    // pipe over the order id
    orderId,
    // query for the order
    orderId =>
      tryPromise({
        try: () => findById(orderId),
        catch: e => new SQLExecutionError(e),
      }),
    // assert the order exists
    flatMap(maybeOrder =>
      maybeOrder
        ? succeed(maybeOrder)
        : fail(new NotFoundError('Order not found')),
    ),
    // query for the shop
    flatMap(order =>
      tryPromise({
        try: async () => ({
          shop: await ShopService.findById(order.shop),
          order,
        }),
        catch: e => new SQLExecutionError(e),
      }),
    ),
    // and assert it's type
    flatMap(({ order, shop }) => {
      if (shop === null || shop.__sourceConfig.type !== 'square')
        return fail(new NotFoundError('Shop not found'));
      return succeed({ order, shop: shop as Shop<'square'> });
    }),
    // TODO this will go away with the refactor
    flatMap(({ order, shop }) =>
      Effect.try(() => ({
        shop,
        order: {
          ...order,
          orderItems: order.orderItems?.map<OrderItem>(o => ({
            ...o,
            paidPrice:
              paidPrices?.[o?.id] || genericError("Paid price doesn't exist"),
          })),
        },
      })),
    ),
    // TODO
    // use the relayer service to pull funds on behalf of the user
    map(({ order, shop }) => ({
      order: {
        ...order,
        status: '2-submitting',
        transactionHash: Effect.runSync(
          payForOrderViaUSDCAuthorization(order, signature),
        ),
      } satisfies PaidOrder,
      shop,
    })),
    // create the order in square and add a pickup fulfilment
    flatMap(({ order, shop }) =>
      tryPromise({
        try: async () => {
          const squareOrder = await SquareService.createOrder(
            shop.__sourceConfig.merchantId,
            {
              fulfillments: [
                {
                  type: 'PICKUP',
                  state: 'PROPOSED',
                  pickupDetails: {
                    recipient: {
                      displayName: 'DO NOT MAKE',
                    },
                    pickupAt: new Date().toISOString(),
                  },
                },
              ],
              ...mapOrderToSquareOrder(shop, order),
            },
          );
          const nextOrder: PaidOrder = {
            ...order,
            status: '3-in-progress',
            externalOrderInfo: {
              __type: 'square',
              orderId:
                squareOrder.id ||
                genericError(
                  'Square order id not present in createOrder response',
                ),
              orderNumber: squareOrder.ticketName || '',
              status: deriveOrderStatusFromSquareOrderState(squareOrder.state),
            },
          };

          return {
            order: nextOrder,
            shop,
            squareOrder,
          };
        },
        catch: e => new SquareServiceError(e),
      }),
    ),
    tap(({ order }) =>
      tryPromise({
        try: () => sql`
        UPDATE orders
        SET

        "externalOrderInfo" = ${JSON.stringify(order.externalOrderInfo)},
        "transactionHash" = ${order.transactionHash},
        "status" = ${order.status},
        "orderItems" = ${JSON.stringify(order.orderItems)}
    
        WHERE id = ${orderId}
        RETURNING *
      `,
        catch: e => new SQLExecutionError(e),
      }),
    ),
    // pay for the order using type "EXTERNAL"
    andThen(({ order, shop }) =>
      tryPromise({
        try: async () => ({
          order,
          shop,
          payment: await SquareService.payForOrder({
            merchantId: shop.__sourceConfig.merchantId,
            locationId: shop.__sourceConfig.locationId,
            order,
          }),
        }),
        catch: e => new SquareServiceError(e),
      }),
    ),
    catchTag('SquareServiceError', e => {
      return tryPromise({
        try: async () => {
          const res = await sql`
            UPDATE orders
            SET

            "status" = ${'error' satisfies OrderStatus},
            "errorMessage" = ${e.toString()}
        
            WHERE id = ${orderId}
            RETURNING *
          `
            .then(() => e)
            .catch(e => new SQLExecutionError(e));

          throw res;
        },
        catch: e => e as SQLExecutionError | SquareServiceError,
      });
    }),
    map(pipe => pipe.order),
  );

  return pipeline;
}

const pay = (
  params:
    | {
        orderId: UUID;
        transactionHash: Hash;
        paidPrices: Record<UUID, Currency>;
        type: 'slice';
      }
    | {
        orderId: UUID;
        signature: Hex;
        paidPrices: Record<UUID, Currency>;
        type: 'square';
      },
): Effect.Effect<
  Order,
  | SQLExecutionError
  | NotFoundError
  | GenericError
  | SquareServiceError
  | UnknownException
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
    o => 'externalOrderInfo' in o && o.status === '3-in-progress',
  ) as PaidOrder[];
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

  if (order.status === '1-pending') return order;

  const txSettled = await getTransactionReceipt(BASE_CLIENT, {
    hash: order.transactionHash,
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

  order.orderItems = [];
  await sql`
    UPDATE orders
    SET "orderItems" = ${JSON.stringify(order.orderItems)}
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
  update,
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
