import { Entity } from '@/data-model/__global/entities';
import { Currency } from '@/data-model/_common/currency';
import { USDC } from '@/data-model/_common/currency/USDC';
import { Unsaved, UUID } from '@/data-model/_common/type/CommonType';
import { Location } from '@/data-model/_common/type/LocationType';
import { ItemCategory } from '@/data-model/item/common';
import { ItemMod } from '@/data-model/item/ItemMod';
import { Item, ItemVariant } from '@/data-model/item/ItemType';
import { Order, OrderStatus } from '@/data-model/order/OrderType';
import {
  DEFAULT_BACKGROUND_IMAGE,
  DEFAULT_SHOP_LOGO,
  EMPTY_MENU,
  EMPTY_TIP_CONFIG,
  getMerchantIdFromSquareExternalId,
  isSquareShop,
} from '@/data-model/shop/ShopDTO';
import {
  Menu,
  Shop,
  SquareExternalId,
  SquareShopConfig,
} from '@/data-model/shop/ShopType';
import { SquareConnection } from '@/data-model/square-connection/SquareConnectionType';
import {
  genericError,
  mappingError,
  UnimplementedPathError,
} from '@/lib/effect';
import { generateUUID, hasAtLeastOne, isProd } from '@/lib/utils';
import { SquareService } from '@/services/SquareService';
import { randomBytes } from 'crypto';
import {
  CatalogCategory,
  CatalogImage,
  CatalogObject,
  Fulfillment,
  Money,
  OrderLineItemModifier,
  Location as SquareLocation,
  Merchant as SquareMerchant,
  Order as SquareOrder,
  OrderLineItem as SquareOrderLineItem,
} from 'square';
import {
  buildMenuFromItems,
  deriveCategoryFromItemName,
  deriveDefaultImageFromItemName,
} from '../common';
import { SquareOrderFulfillmentState, SquareOrderStatus } from './SquareType';

type ImageLookup = Record<string, CatalogImage>;

const ZERO_SQUARE_MONEY: Money = { amount: 0n, currency: 'USD' };

//
//// ID / ENUM DERIVATION
///

/**
 * @dev the id of the shop in the drip DB will be derived from the square external id
 */
export const deriveShopIdFromSquareStoreExternalId = (
  squareExternalId: SquareExternalId,
): UUID => generateUUID(`${squareExternalId}`);

/**
 * @dev the item id in the drip db will be derived from the itemId in square, and the `SQUARE_ITEM` prefix
 */
export function deriveDripIdFromSquareVariantId(variant: CatalogObject): UUID {
  return generateUUID(`SQUARE_VARIANT:${variant.id}`);
}

export function deriveDripIdFromSquareItemId(item: CatalogObject): UUID {
  return generateUUID(`SQUARE_ITEM:${item.id}`);
}

/**
 * @dev a square connection should map 1:1 with a merchant, therefore we can use the merchantId to derive the connection info
 */
export function deriveSquareConnectionIdFromMerchantId(
  merchantId: SquareConnection['merchantId'],
): UUID {
  return generateUUID('SQUARE_CONNECTION' + merchantId);
}

/**
 * @throws on empty state variable
 */
export const deriveOrderStatusFromSquareOrderState = (
  state: SquareOrder['state'],
): OrderStatus => {
  if (!state) throw Error('Square order state is undefined');

  const _state = state as SquareOrderStatus;
  if (_state === SquareOrderStatus.OPEN) return '2-in-progress';
  if (_state === SquareOrderStatus.DRAFT) return '2-in-progress';

  if (_state === SquareOrderStatus.COMPLETED) return '3-complete';
  if (_state === SquareOrderStatus.CANCELED) return 'cancelled';

  let n: never = _state;
  throw Error(`unimplemented square order state: ${state}`);
};

/**
 * @throws on empty state variable
 */
export const deriveOrderStatusFromSquareOrderFulfillmentState = (
  state: Fulfillment['state'],
): OrderStatus => {
  if (!state) throw Error('Square order state is undefined');

  const _state = state as SquareOrderFulfillmentState;
  switch (_state) {
    case SquareOrderFulfillmentState.PROPOSED:
    case SquareOrderFulfillmentState.RESERVED:
      return '2-in-progress';
    case SquareOrderFulfillmentState.PREPARED:
    case SquareOrderFulfillmentState.COMPLETED:
      return '3-complete';
    case SquareOrderFulfillmentState.CANCELED:
    case SquareOrderFulfillmentState.FAILED:
      return 'cancelled';
  }
};

//
//// UTILITY FUNCTIONS
///

function getItemCategoryFromSquareItem(
  squareCatalogObject: CatalogObject,
  categoryMap: Record<string, CatalogCategory>,
): ItemCategory | null {
  const itemName = squareCatalogObject.itemData?.name;
  if (!itemName) return null;

  if (squareCatalogObject.type !== 'ITEM')
    return deriveCategoryFromItemName(itemName);

  const categories = squareCatalogObject.itemData?.categories;
  if (!categories || categories.length === 0)
    return deriveCategoryFromItemName(itemName);

  const maybeCategory = categories
    .map(c => categoryMap[c?.id || ''])
    .map(c => c?.name)
    .find(c => !!c);

  if (maybeCategory) return maybeCategory;
  return deriveCategoryFromItemName(itemName);
}

function getImageDataFromSquareCatalogObject(
  imageLookup: ImageLookup,
  squareItem: CatalogObject,
) {
  const squareImage =
    imageLookup[squareItem.itemData?.imageIds?.[0] || '']?.url;

  return (
    squareImage || deriveDefaultImageFromItemName(squareItem.itemData?.name)
  );
}

//
//// MAPPING FUNCTIONS
///

export const mapSquareMoneyToCurrency = ({
  amount: amountCents,
  currency,
}: Money): Currency => {
  if (amountCents === null || amountCents === undefined)
    genericError('mapSquareMoneyToCurrency: expected amount');

  if (currency === 'USD') return USDC.fromCents(amountCents!);

  throw new UnimplementedPathError(
    `transformation of Money -> ${currency} is not yet supported`,
  );
};

export const mapCurrencyToSquareMoney = (currency: Currency): Money => {
  if (currency.__currencyType === 'ETH')
    throw new UnimplementedPathError(
      'transformation of ETH -> Money is not yet supported',
    );
  if (currency.__currencyType === 'USDC')
    return {
      amount: currency.toCents(),
      currency: 'USD',
    };

  let n: never = currency;
  throw new UnimplementedPathError(`currency not implemented yet: ${currency}`);
};

export function mapSquareLocationToLocation({
  address,
  coordinates,
}: SquareLocation): Location {
  if (!address) throw Error("Square Location's address is undefined");

  return {
    address: `${address.addressLine1}${address.addressLine2 ? ` ${address.addressLine2}` : ''}, ${address.locality}, ${address.administrativeDistrictLevel1} ${address.postalCode}`,
    coords: [
      coordinates?.latitude || genericError('Square latitude is required'),
      coordinates?.longitude || genericError('Square longitude is required'),
    ],
    label: `${address.locality}, ${address.administrativeDistrictLevel1}`,
  };
}

export const mapItemModToSquareModification = (
  mods: ItemMod[],
): OrderLineItemModifier[] =>
  mods.map<OrderLineItemModifier>(m => {
    if (m.__sourceConfig.type !== 'square')
      genericError(
        `Expected type: \`square\` on modifier source config on: ${m.name}`,
      );

    return {
      catalogObjectId: m.__sourceConfig.id,
      name: m.name,
      quantity: m.quantity.toString(),
      basePriceMoney: mapCurrencyToSquareMoney(m.price),
      totalPriceMoney: mapCurrencyToSquareMoney(m.price),
    };
  });

export const mapOrderToSquareOrder = (
  shop: Shop<'square'>,
  order: Unsaved<Order>,
): SquareOrder => {
  if (!isSquareShop(shop)) throw Error('expected square shop');

  const lineItems = order.lineItems.map<SquareOrderLineItem>(lineItem => {
    if (lineItem.variant.__sourceConfig.type !== 'square')
      throw Error('expected square type variant');

    return {
      // the catalog object id is the sourceConfig's id
      catalogObjectId: lineItem.variant.__sourceConfig.id,
      quantity: lineItem.quantity.toString(),
      // include mods if they're present on the order
      ...(lineItem.mods
        ? { modifiers: mapItemModToSquareModification(lineItem.mods) }
        : {}),
    };
  });

  const orderIdentifier = randomBytes(4).toString('base64url');

  const useTestFulfillments = !isProd();
  const [ticketName, fulfillment] = !useTestFulfillments
    ? [
        orderIdentifier,
        {
          type: 'PICKUP',
          state: 'PROPOSED',
          pickupDetails: {
            recipient: {
              displayName: `Drip Order ${orderIdentifier}`,
            },
            pickupAt: new Date().toISOString(),
          },
        } satisfies Fulfillment,
      ]
    : [
        'DO NOT MAKE!',
        {
          type: 'PICKUP',
          state: 'PROPOSED',
          pickupDetails: {
            recipient: {
              displayName: 'DO NOT MAKE',
            },
            pickupAt: new Date().toISOString(),
          },
        } satisfies Fulfillment,
      ];

  return {
    locationId: shop.__sourceConfig.locationId,
    ticketName,
    lineItems: lineItems,
    fulfillments: [fulfillment],
  } satisfies SquareOrder;
};

export const mapSquareStoreToShop = ({
  squareLocation,
  squareshopConfig,
}: {
  squareLocation: SquareLocation;
  squareshopConfig: SquareShopConfig;
}): Shop => {
  const location = (function () {
    // prefer to use the manual shopConfig's location
    if (squareshopConfig.location) return squareshopConfig.location;
    // then use the squareLocation
    if (squareLocation.address)
      return mapSquareLocationToLocation(squareLocation);
    return null;
  })();

  // extract the merchant id from the externalId
  const merchantId: string = getMerchantIdFromSquareExternalId(
    squareshopConfig.externalId,
  );

  const locationId =
    squareLocation.id ||
    genericError(`Missing location id on squareStore ${squareshopConfig.name}`);

  return {
    id: deriveShopIdFromSquareStoreExternalId(squareshopConfig.externalId),
    __entity: Entity.shop,
    __type: 'storefront',
    __sourceConfig: {
      type: 'square',
      merchantId,
      locationId,
    },
    tipConfig: squareshopConfig.tipConfig || EMPTY_TIP_CONFIG,
    menu: EMPTY_MENU,
    label:
      // start with the user overrided name
      squareshopConfig.name ||
      // then use name of the actual brick-n-mortal store
      squareLocation.name ||
      // otherwise error
      genericError('business must include a name'),
    location: location,
    backgroundImage:
      squareLocation.posBackgroundUrl ||
      squareLocation.fullFormatLogoUrl ||
      // worst case use the logo as a background image
      squareLocation.logoUrl ||
      DEFAULT_BACKGROUND_IMAGE,
    logo:
      // try and use the logo url
      squareLocation.logoUrl ||
      // then try and use the pos background url
      squareLocation.posBackgroundUrl ||
      // then try and use the full format logo url
      squareLocation.fullFormatLogoUrl ||
      // otherwise use the default logo
      DEFAULT_SHOP_LOGO,
    farmerAllocations: squareshopConfig.farmerAllocation || [],
  };
};

//
//// SHOP BUILDER FUNCTIONS
///
const buildItemsFromCatalogObjects = (
  items: CatalogObject[],
  imageLookup: ImageLookup,
  categories: Record<string, CatalogCategory>,
  modifiers: CatalogObject[],
): Item[] => {
  return items
    .map<Item | null>(catalogObject => {
      if (
        // if there are no variants
        !catalogObject.itemData?.variations?.length ||
        // or it's been deleted
        catalogObject.isDeleted === true ||
        // or archived
        catalogObject.itemData.isArchived === true
      )
        return null;

      // first build up the variants
      const variants = catalogObject
        .itemData!.variations!.map<ItemVariant | null>(
          (variationCatalogObject: CatalogObject) => {
            const variationData = variationCatalogObject.itemVariationData;
            if (
              // if the variation data is missing
              !variationData ||
              // or it's been deleted
              variationCatalogObject.isDeleted === true ||
              // or it's not sellable
              variationData?.sellable === false
            )
              // then skip it
              return null;

            return {
              id: deriveDripIdFromSquareVariantId(variationCatalogObject),
              __sourceConfig: {
                type: 'square',
                id: variationCatalogObject.id,
              },
              name:
                variationData?.name ||
                mappingError('expected square item variation name'),
              description:
                variationCatalogObject.itemData?.description ||
                catalogObject.itemData?.description ||
                '',
              image: getImageDataFromSquareCatalogObject(
                imageLookup,
                variationCatalogObject,
              ),
              price: mapSquareMoneyToCurrency(
                variationData?.priceMoney || ZERO_SQUARE_MONEY,
              ),
            } satisfies ItemVariant;
          },
        )
        .filter(v => !!v);

      // then build up the item
      const item: Item = {
        id: deriveDripIdFromSquareItemId(catalogObject),
        name:
          catalogObject.itemData?.name ||
          mappingError('expected square item name'),
        description: catalogObject.itemData?.description || '',
        image: getImageDataFromSquareCatalogObject(imageLookup, catalogObject),
        category: getItemCategoryFromSquareItem(catalogObject, categories),
        variants: hasAtLeastOne(variants)
          ? variants
          : mappingError('expected at least one variant'),
      };

      return item;
    })
    .filter(i => !!i);
};

export async function buildMenuFromSquareCatalog({
  merchant,
  location,
}: {
  merchant: SquareMerchant;
  location: SquareLocation;
}): Promise<{ menu: Menu; items: Item[] }> {
  const catalog = await SquareService.fetchCatalog(merchant.id!);

  const { imageLookup, items, modifiers, categories } = catalog
    .filter(i => i)
    .reduce<{
      imageLookup: ImageLookup;
      items: CatalogObject[];
      modifiers: CatalogObject[];
      categories: Record<string, CatalogCategory>;
    }>(
      (acc, item) => {
        if (item.type === 'IMAGE' && item.imageData)
          acc.imageLookup[item.id] = item.imageData;
        if (item.type === 'ITEM') acc.items.push(item);
        if (item.type === 'MODIFIER') acc.modifiers.push(item);
        if (item.type === 'CATEGORY' && item.categoryData)
          acc.categories[item.id] = item.categoryData;
        return acc;
      },
      { imageLookup: {}, items: [], modifiers: [], categories: {} },
    );

  const isAvailableAtLocation = (item: CatalogObject) =>
    // it's either present at all locations ( so a short circuit true )
    item.presentAtAllLocations ||
    // or it is _not_ absent at some of the locations ( yeah IK lol )
    !item.absentAtLocationIds?.some(
      id => id.toLowerCase() === location.id?.toLowerCase(),
    );

  const filterByFoodAndBev = (item: CatalogObject) =>
    item.type === 'ITEM' && item.itemData?.productType === 'FOOD_AND_BEV';

  // filtered Items are FOOD_AND_BEV only
  const filteredItems: CatalogObject[] = items
    .filter(isAvailableAtLocation)
    .filter(filterByFoodAndBev);

  const finalizedItems: Item[] = buildItemsFromCatalogObjects(
    filteredItems,
    imageLookup,
    categories,
    modifiers,
  );

  const menu = buildMenuFromItems(finalizedItems);

  return { menu: menu, items: finalizedItems };
}
