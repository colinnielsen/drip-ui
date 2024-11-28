import { Entity } from '@/data-model/__global/entities';
import { USDC } from '@/data-model/_common/currency/USDC';
import { SupportedCurrency } from '@/data-model/_common/type/CommonType';
import { Location } from '@/data-model/_common/type/LocationType';
import { Item, ItemCategory } from '@/data-model/item/ItemType';
import {
  DEFAULT_BACKGROUND_IMAGE,
  DEFAULT_SHOP_LOGO,
  EMPTY_MENU,
} from '@/data-model/shop/ShopDTO';
import { Menu, Shop, StoreConfig } from '@/data-model/shop/ShopType';
import { SquareConnection } from '@/data-model/square-connection/SquareConnectionType';
import { err, generateUUID } from '@/lib/utils';
import { SquareService } from '@/services/SquareService';
import { UUID } from 'crypto';
import {
  CatalogImage,
  CatalogObject,
  Location as SquareLocation,
  Merchant as SquareMerchant,
} from 'square';
import {
  buildMenuFromItems,
  deriveCategoryFromItemName,
  deriveDefaultImageFromItemName,
} from '../common';

type ImageLookup = Record<string, CatalogImage>;

export const deriveShopIdFromSquareStoreId = (merchantId: string) =>
  generateUUID(`${merchantId}`);

export function deriveDripIdFromSquareItemId(itemId: string) {
  return generateUUID(`SQUARE_ITEM:${itemId}`);
}

export function deriveSquareConnectionIdFromMerchantId(
  merchantId: SquareConnection['merchantId'],
): UUID {
  return generateUUID('SQUARE_CONNECTION' + merchantId);
}

export function getLocationFromSquareLocation({
  merchantId,
  address,
  coordinates,
}: SquareLocation): Location {
  if (!address) throw Error("Square Location's address is undefined");
  return {
    address: `${address.addressLine1}${address.addressLine2 ? ` ${address.addressLine2}` : ''}, ${address.locality}, ${address.administrativeDistrictLevel1} ${address.postalCode}`,
    coords: [
      coordinates?.latitude ||
        err('Square latitude is required', {
          address,
          merchantId,
          coordinates,
        }),
      coordinates?.longitude ||
        err('Square longitude is required', {
          address,
          merchantId,
          coordinates,
        }),
    ],
    label: `${address.locality}, ${address.administrativeDistrictLevel1}`,
  };
}

function determineCatalogObjectAvailability(
  locationId: string,
  squareItem: CatalogObject,
): Item['availability'] {
  if (
    squareItem.presentAtAllLocations ||
    squareItem.presentAtLocationIds?.some(id => id === locationId)
  )
    return 'onsite-only';
  return 'online-only';
}

function getItemCategoryFromSquareItem(
  squareItem: CatalogObject,
): ItemCategory | null {
  const itemName = squareItem.itemData?.name;

  if (!itemName) return null;
  else return deriveCategoryFromItemName(itemName);
}

function getImageDataFromSquareItem(
  imageLookup: ImageLookup,
  squareItem: CatalogObject,
) {
  const squareImage =
    imageLookup[squareItem.itemData?.imageIds?.[0] || '']?.url;

  return (
    squareImage || deriveDefaultImageFromItemName(squareItem.itemData?.name)
  );
}

function getCurrencyFromSquareItem(
  squareItem: CatalogObject,
): Extract<SupportedCurrency, 'usdc'> {
  const currency =
    squareItem.itemData?.variations?.[0]?.itemVariationData?.priceMoney
      ?.currency;

  if (currency === 'USD') return 'usdc';

  throw Error(
    `Unsupported Item currency: on ${squareItem.id}. Currency: ${currency}`,
  );
}

function getPriceFromSquareItem(squareItem: CatalogObject): USDC {
  const type = getCurrencyFromSquareItem(squareItem);
  const priceMoney = Number(
    squareItem.itemData?.variations?.[0]?.itemVariationData?.priceMoney?.amount,
  );

  if (!priceMoney) return USDC.fromUSD(0);
  if (type === 'usdc') return USDC.fromUSD(priceMoney / 100);
  throw Error(
    `Unsupported Item currency: on ${squareItem.id}. Currency: ${type}`,
  );
}

export const mapSquareStoreToShop = ({
  merchantId,
  squareStore,
  squareLocation,
  storeConfig,
}: {
  merchantId: string;
  squareStore: SquareMerchant;
  squareLocation: SquareLocation;
  storeConfig: StoreConfig;
}): Shop => {
  return {
    __entity: Entity.shop,
    __type: 'storefront',
    __sourceConfig: {
      type: 'square',
      merchantId,
    },
    id: deriveShopIdFromSquareStoreId(merchantId),
    tipConfig: storeConfig.tipConfig || {
      __type: 'single-recipient',
      enabled: false,
    },
    menu: EMPTY_MENU,
    label:
      squareStore.businessName ||
      storeConfig.name ||
      err('business must include a name'),
    location:
      'location' in storeConfig
        ? storeConfig.location
        : squareLocation.address
          ? getLocationFromSquareLocation(squareLocation)
          : null,
    backgroundImage:
      squareLocation.posBackgroundUrl ||
      squareLocation.fullFormatLogoUrl ||
      DEFAULT_BACKGROUND_IMAGE,
    logo: squareLocation.logoUrl || DEFAULT_SHOP_LOGO,
    farmerAllocations: storeConfig.farmerAllocation || [],
  };
};

export async function buildMenuFromSquareCatalog({
  merchant,
  location,
}: {
  merchant: SquareMerchant;
  location: SquareLocation;
}): Promise<{ menu: Menu; items: Item[] }> {
  const catalog = await SquareService.fetchCatalog(merchant.id!);

  const { imageLookup, items, modifiers } = catalog
    .filter(i => i)
    .reduce<{
      imageLookup: ImageLookup;
      items: CatalogObject[];
      modifiers: CatalogObject[];
    }>(
      (acc, item) => {
        if (item.type === 'IMAGE' && item.imageData)
          acc.imageLookup[item.id] = item.imageData;
        if (item.type === 'ITEM') acc.items.push(item);
        if (item.type === 'MODIFIER') acc.modifiers.push(item);
        return acc;
      },
      { imageLookup: {}, items: [], modifiers: [] },
    );

  const isAvailableAtLocation = (item: CatalogObject) =>
    item.presentAtAllLocations ||
    !item.absentAtLocationIds?.some(id => id === location.id);

  const filterByFoodAndBev = (item: CatalogObject) =>
    item.type === 'ITEM' && item.itemData?.productType === 'FOOD_AND_BEV';

  // filtered Items are food and bev
  const filteredItems = items
    .filter(isAvailableAtLocation)
    .filter(filterByFoodAndBev);

  const finalizedItems = filteredItems.map<Item>(squareItem => {
    return {
      // __entity: Entity.item,
      __sourceConfig: {
        type: 'square',
        id: squareItem.id,
      },
      id: deriveDripIdFromSquareItemId(squareItem.id),
      availability: determineCatalogObjectAvailability(
        location.id || err('expected square location id'),
        squareItem,
      ),
      description: squareItem.itemData?.description || '',
      image: getImageDataFromSquareItem(imageLookup, squareItem),
      name: squareItem.itemData?.name || err('expected square item name'),
      category: getItemCategoryFromSquareItem(squareItem),
      currency: getCurrencyFromSquareItem(squareItem),
      price: getPriceFromSquareItem(squareItem),
      mods: [],
    } satisfies Item;
  });

  return { menu: buildMenuFromItems(finalizedItems), items: finalizedItems };
}
