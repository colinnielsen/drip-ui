import { PersistanceLayer } from '@/data-model/_common/db/PersistanceType';
import { deriveSquareConnectionIdFromMerchantId } from '@/data-model/_external/data-sources/square/SquareDTO';
import { SquareError } from '@/data-model/_external/data-sources/square/SquareType';
import { getOrderSummary } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import {
  getLocationIdFromSquareExternalId,
  getMerchantIdFromSquareExternalId,
} from '@/data-model/shop/ShopDTO';
import { SquareStoreConfig } from '@/data-model/shop/ShopType';
import {
  DecryptedSquareConnection,
  SquareConnection,
} from '@/data-model/square-connection/SquareConnectionType';
import SquareConnectionPersistance from '@/infrastructures/sql/SquareConnectionPersistance';
import { BaseEffectError } from '@/lib/effect';
import getSquareClient from '@/lib/squareClient';
import { err } from '@/lib/utils';
import {
  ApiResponse,
  CatalogObject,
  CreateOrderResponse,
  Location,
  Merchant,
  Order as SquareOrder,
} from 'square';

export type SquareStoreInfo = {
  merchant: Merchant;
  location: Location;
};

// ERRORS
export class SquareServiceError extends BaseEffectError {
  readonly _tag = 'SquareServiceError' as const;
}

// UTILS

const _getSquareClientFromMerchantId = async (merchantId: string) => {
  const accessToken = await findSquareConnectionByMerchantId(merchantId).then(
    c =>
      c?.accessToken ||
      (() => {
        debugger;
        throw new Error(`Access token not found on mechantId: ${merchantId}`);
      })(),
  );

  return getSquareClient().withConfiguration({
    bearerAuthCredentials: {
      accessToken,
    },
  });
};

// API
// -----------------------------------------------------------------------------

const findSquareConnectionByMerchantId = async (
  merchantId: string,
): Promise<DecryptedSquareConnection | null> => {
  const connection = await SquareConnectionPersistance.findById(
    deriveSquareConnectionIdFromMerchantId(merchantId),
  );
  return connection;
};

const getOrder = async ({
  merchantId,
  orderId,
}: {
  merchantId: string;
  orderId: string;
}): Promise<SquareOrder> => {
  const squareClientWithAccessToken =
    await _getSquareClientFromMerchantId(merchantId);

  const response =
    await squareClientWithAccessToken.ordersApi.retrieveOrder(orderId);

  if (!response.result.order)
    throw new SquareError('Order not found', response.result.errors);

  return response.result.order!;
};

const fetchLocationsByMerchantId = async (merchantId: string) => {
  const squareClientWithAccessToken =
    await _getSquareClientFromMerchantId(merchantId);

  const response =
    await squareClientWithAccessToken.locationsApi.listLocations();

  if (!response.result.locations)
    throw new SquareError('Locations not found', response.result.errors);

  return response.result.locations!;
};

const fetchLocation = async (merchantId: string, locationId: string) => {
  const squareClientWithAccessToken =
    await _getSquareClientFromMerchantId(merchantId);

  const response =
    await squareClientWithAccessToken.locationsApi.retrieveLocation(locationId);

  if (!response.result.location)
    throw new SquareError('Location not found', response.result.errors);

  return response.result.location!;
};

const fetchMerchant = async (merchantId: string) => {
  const squareClientWithAccessToken =
    await _getSquareClientFromMerchantId(merchantId);

  const response =
    await squareClientWithAccessToken.merchantsApi.retrieveMerchant(merchantId);

  if (!response.result.merchant)
    throw new SquareError('Merchant not found', response.result.errors);

  return response.result.merchant!;
};

const fetchSquareStoreInfo = async (
  externalId: SquareStoreConfig['externalId'],
): Promise<SquareStoreInfo> => {
  const [merchantId, locationId] = [
    getMerchantIdFromSquareExternalId(externalId),
    getLocationIdFromSquareExternalId(externalId),
  ];

  const squareClientWithAccessToken =
    await _getSquareClientFromMerchantId(merchantId);

  // get the merchant info from square
  const merchantResponse =
    await squareClientWithAccessToken.merchantsApi.retrieveMerchant(merchantId);
  const merchant = merchantResponse.result.merchant;

  if (!merchant)
    throw new SquareError('Merchant not found', merchantResponse.result.errors);

  const locationResponse =
    await squareClientWithAccessToken.locationsApi.retrieveLocation(locationId);
  const location = locationResponse.result.location;

  if (!location)
    throw new SquareError('Location not found', merchantResponse.result.errors);

  return { merchant, location };
};

const fetchCatalog = async (merchantId: string) => {
  const squareClientWithAccessToken =
    await _getSquareClientFromMerchantId(merchantId);

  let catalogObjects: CatalogObject[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const inventoryResponse =
      await squareClientWithAccessToken.catalogApi.listCatalog(
        cursor,
        'ITEM,MODIFIER,IMAGE',
      );
    catalogObjects.push(...(inventoryResponse.result.objects || []));
    if (!inventoryResponse.result.cursor) break;
    cursor = inventoryResponse.result.cursor;
  }
  return catalogObjects;
};

const createOrder = async (merchantId: string, order: SquareOrder) => {
  const squareClientWithAccessToken =
    await _getSquareClientFromMerchantId(merchantId);

  const idempotencyKey = crypto.randomUUID();

  const res = await squareClientWithAccessToken.ordersApi
    .createOrder({
      idempotencyKey,
      order,
    })
    .catch(e => e as ApiResponse<CreateOrderResponse>);

  if (res.result.errors)
    throw new SquareError('Error creating order on Square', res.result.errors);

  if (!res.result.order)
    throw new SquareError(
      'Order not present in createOrder response',
      res.result.errors,
    );

  return res.result.order;
};

/**
 * Takes a Drip order and pays for it on square.
 * @notice Sends the order to the POS
 * @see {@link https://developer.squareup.com/reference/square/payments-api/create-payment|Square Docs}
 */
const payForOrder = async ({
  order,
  merchantId,
  locationId,
}: {
  order: Order;
  merchantId: string;
  locationId: string;
}) => {
  if (order.status === '4-complete')
    throw new Error('Order is already complete');
  if (order.status === '1-pending') throw new Error('Order is pending');

  const squareClientWithAccessToken =
    await _getSquareClientFromMerchantId(merchantId);

  const orderSummary = getOrderSummary(order);

  const response = await squareClientWithAccessToken.paymentsApi
    .createPayment({
      idempotencyKey: crypto.randomUUID(),
      orderId:
        order.externalOrderInfo?.orderId || err('square order id not saved'),
      locationId,
      sourceId: 'EXTERNAL',
      amountMoney: {
        amount: orderSummary.subTotal.usdc.toCents(),
        currency: 'USD',
      },
      // will auto complete the order, sending it to the POS
      autocomplete: true,
      note: 'Drip Payment',
      tipMoney: orderSummary.tip
        ? {
            amount: orderSummary.tip.usdc.toCents(),
            currency: 'USD',
          }
        : undefined,
      externalDetails: {
        type: 'CRYPTO',
        source: 'Drip',
        // TODO: if drip ever takes a fee - this needs to be updated
        sourceFeeMoney: {
          amount: 0n,
          currency: 'USD',
        },
      },
    })
    .catch(e => new SquareError(e.message, e.errors));

  if (response instanceof SquareError) throw response;
  if (response.result.errors || !response.result.payment)
    throw new SquareError(
      'Error paying for order on Square',
      response.result.errors,
    );

  return response.result.payment!;
};

function getSquareService(
  persistanceLayer: PersistanceLayer<SquareConnection>,
) {
  return {
    ...persistanceLayer,
    fetchLocationsByMerchantId,
    fetchLocation,
    fetchSquareStoreInfo,
    fetchMerchant,
    fetchCatalog,
    getOrder,
    findSquareConnectionByMerchantId,
    createOrder,
    payForOrder,
  };
}

export const SquareService = getSquareService(SquareConnectionPersistance);
