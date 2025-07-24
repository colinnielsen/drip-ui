// Square Location API helpers

import axios from 'axios';
import { UUID } from '@/data-model/_common/type/CommonType';
import { Location } from '@/data-model/_common/type/LocationType';
import { mapToSqaureExternalId } from '@/data-model/shop/ShopDTO';
import { SquareShopConfig } from '@/data-model/shop/ShopType';
import { ShopConfigRequest } from '@/pages/api/shops/shop-config';
import { EthAddress } from '@/data-model/ethereum/EthereumType';

// Sync the Square location after config has been saved / updated
export const syncSquareLocation = async (
  merchantId: string,
  locationId: string,
) =>
  await axios
    .post<{ shopId: UUID }>('/api/shops/sync?type=square', {
      externalId: mapToSqaureExternalId({ merchantId, locationId }),
    })
    .then(res => res.data.shopId);

// Remove a shop configuration (DELETE)
export const deleteShopConfig = async (
  merchantId: string,
  locationId: string,
) =>
  await axios.delete('/api/shops/shop-config', {
    data: {
      type: 'square',
      merchantId,
      locationId,
    },
  });

// Payload accepted by updateShopConfig helper
export type UpdateShopConfigPayload = {
  name?: string;
  logo?: string;
  backgroundImage?: string;
  url?: string;
  fundRecipient?: EthAddress;
  tipRecipient?: EthAddress;
  location?: Location;
};

// Either create a new config ("add") or update an existing one ("update")
export const updateShopConfig = async (
  action: 'add' | 'update',
  merchantId: string,
  locationId: string,
  data: UpdateShopConfigPayload,
) =>
  await axios
    .post<SquareShopConfig>('/api/shops/shop-config', {
      action,
      type: 'square',
      locationId,
      merchantId,
      ...data,
    } satisfies ShopConfigRequest)
    .then(res => res.data);
