import { PersistanceLayer } from '@/data-model/_common/db/PersistanceType';
import { deriveSquareConnectionIdFromMerchantId } from '@/data-model/_external/data-sources/square/SquareDTO';
import {
  DecryptedSquareConnection,
  SquareConnection,
} from '@/data-model/square-connection/SquareConnectionType';
import SquareConnectionPersistance from '@/infrastructures/sql/SquareConnectionPersistance';
import getSquareClient from '@/lib/squareClient';
import { err } from '@/lib/utils';
import { CatalogObject, Location, Merchant } from 'square';

export type SquareStoreInfo = {
  merchant: Merchant;
  location: Location;
};

const findSquareConnectionByMerchantId = async (
  merchantId: string,
): Promise<DecryptedSquareConnection | null> => {
  const connection = await SquareConnectionPersistance.findById(
    deriveSquareConnectionIdFromMerchantId(merchantId),
  );
  return connection;
};

const fetchSquareStoreInfo = async (
  merchantId: string,
): Promise<SquareStoreInfo> => {
  // get the decrypted access token from the DB
  const accessToken = await findSquareConnectionByMerchantId(merchantId).then(
    c => c?.accessToken || err('Access token not found'),
  );

  // create a square client with the access token
  const squareClientWithAccessToken = getSquareClient().withConfiguration({
    bearerAuthCredentials: {
      accessToken,
    },
  });

  // get the merchant info from square
  const merchantResponse =
    await squareClientWithAccessToken.merchantsApi.retrieveMerchant(merchantId);
  const merchant = merchantResponse.result.merchant;

  if (!merchant || !merchant.mainLocationId)
    throw Error('Merchant not found: ' + merchantResponse.result.errors);

  const locationResponse =
    await squareClientWithAccessToken.locationsApi.retrieveLocation(
      merchant.mainLocationId,
    );
  const location = locationResponse.result.location;

  if (!location)
    throw Error('Location not found: ' + merchantResponse.result.errors);

  return { merchant, location };
};

const fetchCatalog = async (merchantId: string) => {
  const accessToken = await findSquareConnectionByMerchantId(merchantId).then(
    c => c?.accessToken || err('Access token not found'),
  );

  const squareClientWithAccessToken = getSquareClient().withConfiguration({
    bearerAuthCredentials: {
      accessToken,
    },
  });

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

function getSquareService(
  persistanceLayer: PersistanceLayer<SquareConnection>,
) {
  return {
    ...persistanceLayer,
    fetchSquareStoreInfo,
    fetchCatalog,
    findSquareConnectionByMerchantId,
  };
}

export const SquareService = getSquareService(SquareConnectionPersistance);
