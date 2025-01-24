import { Entity } from '@/data-model/__global/entities';
import { Currency } from '@/data-model/_common/currency';
import { Cart } from '@/data-model/cart/CartType';
import { ChainId } from '@/data-model/ethereum/EthereumType';
import {
  Item,
  ItemId,
  ItemVariant,
  ItemVariantId,
} from '@/data-model/item/ItemType';
import {
  EMPTY_MENU,
  EMPTY_TIP_CONFIG,
  mapSliceIdToSliceExternalId,
  mapSliceStoreIdToShopId,
} from '@/data-model/shop/ShopDTO';
import { Menu, Shop, ShopConfig } from '@/data-model/shop/ShopType';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import { genericError, mappingError } from '@/lib/effect';
import { isAddressEql } from '@/lib/ethereum';
import { generateUUID, hasAtLeastOne } from '@/lib/utils';
import {
  ExternalProduct as SliceExternalProduct,
  ProductCart as SliceProduct,
  SlicerBasics as SliceStore,
  Variant as SliceVariant,
} from '@slicekit/core';
import { zeroAddress } from 'viem';
import { ETH } from '../../../_common/currency/ETH';
import { USDC } from '../../../_common/currency/USDC';
import {
  buildMenuFromItems,
  deriveCategoryFromItemName,
  deriveDefaultImageFromItemName,
} from '../common';

export const SLICE_VERSION = 1;

function mapSliceProductToItemCategory(
  product: SliceProduct,
): Item['category'] {
  if (product?.category?.name)
    return product?.category?.name as Item['category'];

  if (product.description && product.description.includes('category:')) {
    const lines = product.description.split('\n');
    const category = lines.find(line => line.includes('category:'));
    const maybeCategpry = category?.split(':')?.[1]?.trim();
    if (maybeCategpry) return maybeCategpry as Item['category'];
  }

  return deriveCategoryFromItemName(product.name);
}

/**
 * @dev the slice product cart has a dbId, but we want to derive our ids from this stable id
 */
const SLICE_EXTERNAL_PRODUCT_ID_TO_DERIVE_FROM: keyof SliceExternalProduct =
  'id';

export function mapSliceExternalProductToItemVariantId(
  product: SliceExternalProduct,
): ItemVariantId {
  return ItemVariantId(
    generateUUID(
      `SLICE_EXTERNAL_PRODUCT:${product[SLICE_EXTERNAL_PRODUCT_ID_TO_DERIVE_FROM] || genericError(`no slice external product id found on ${product} slice store ${product.provider}`)}`,
    ),
  );
}

/**
 * @dev the slice variant has an id, but we want to derive our ids from this stable id
 */
const SLICE_VARIANT_ID_TO_DERIVE_FROM: keyof SliceVariant = 'id';

export function mapSliceVariantToItemVariantId(
  variant: SliceVariant,
): ItemVariantId {
  return ItemVariantId(
    generateUUID(
      `SLICE_VARIANT:${variant[SLICE_VARIANT_ID_TO_DERIVE_FROM] || genericError('no product id')}`,
    ),
  );
}

/**
 * @dev the slice product cart has a dbId, but we want to derive our ids from this stable id
 */
const SLICE_PRODUCT_ID_TO_DERIVE_FROM: keyof SliceProduct = 'dbId';

export function mapSliceProductIdToItemId(product: SliceProduct): ItemId {
  return ItemId(
    generateUUID(
      `SLICE_ITEM:${product[SLICE_PRODUCT_ID_TO_DERIVE_FROM] || genericError(`no DB id found on slice store ${product.slicerId} for item ${product.name}`)}`,
    ),
  );
}

export function mapSliceProductToCurrency(
  product: SliceProduct,
  priceToUse: 'price' | 'basePrice' = 'basePrice',
): Currency | null {
  const {
    currency: { address: currencyAddress },
    // the price in WEI string format
  } = product;
  const price_weiString = product[priceToUse];
  if (isAddressEql(zeroAddress, currencyAddress))
    return ETH.fromWei(price_weiString);
  if (isAddressEql(USDC_CONFIG[ChainId.BASE].address, currencyAddress))
    return USDC.fromWei(price_weiString);

  return null;
}

export const mapSliceProductCartToItem = (
  product: SliceProduct,
): Item | null => {
  const price: Currency =
    mapSliceProductToCurrency(product) ||
    mappingError(
      `no price found on slice store ${product.slicerId} for ${product.name}`,
    );

  // skip items without external products
  if (!product.externalProduct) return null;

  // @dev the base variant is the external product
  const baseVariant: ItemVariant = {
    id: mapSliceExternalProductToItemVariantId(product.externalProduct),
    __sourceConfig: {
      type: 'slice',
      // and the id is matched to map
      id: product.externalProduct.id.toString(),
      version: SLICE_VERSION,
    },
    name: product.externalProduct.providerVariantName || product.name,
    description: product.description || '',
    image: product.images[0] || deriveDefaultImageFromItemName(product.name),
    price: price,
  };

  // some products have additional variants
  const additionalVariants = (product.externalProduct?.providerVariants ?? [])
    .map<ItemVariant | null>(v => {
      if (v.isActive !== undefined && !v.isActive) return null;

      return {
        id: mapSliceVariantToItemVariantId(v),
        __sourceConfig: {
          type: 'slice',
          // we use the variant's id as the source config id
          id: v.id.toString(),
          version: SLICE_VERSION,
        },
        name: v.variant,
        description: '',
        image: deriveDefaultImageFromItemName(v.variant),
        // all slice variants have the same price
        price: price,
      };
    })
    .filter(v => !!v);

  return {
    id: mapSliceProductIdToItemId(product),
    description: product.description || '',
    image: product.images[0] || deriveDefaultImageFromItemName(product.name),
    name: product.name,
    variants: hasAtLeastOne(additionalVariants)
      ? additionalVariants
      : [baseVariant],
    category: mapSliceProductToItemCategory(product),
  } satisfies Item;
};

export function mapCartToSliceCart(
  cart: Cart,
  sliceProducts: SliceProduct[],
): SliceProduct[] {
  const sliceCart = cart.lineItems.reduce<SliceProduct[]>((acc, li) => {
    // find the base products
    const sliceProduct = sliceProducts.find(
      product => mapSliceProductIdToItemId(product) === li.item.id,
    );

    if (!sliceProduct) throw Error('slice product not found');

    return [
      ...acc,
      {
        ...sliceProduct!,
        quantity: li.quantity,
        // set the variantId
        externalVariantId: +li.variant.__sourceConfig.id,
      },
    ];
  }, []);

  return sliceCart;
}

export const mapSliceStoreToShop = (
  sliceStore: SliceStore,
  manualConfig: ShopConfig,
): Shop => {
  sliceStore.slicerConfig?.bannerImage;
  return {
    id: mapSliceStoreIdToShopId(sliceStore.id, SLICE_VERSION),
    __entity: Entity.shop,
    __type: 'storefront',
    __sourceConfig: {
      type: 'slice',
      id: mapSliceIdToSliceExternalId(sliceStore.id),
      version: SLICE_VERSION,
    },
    tipConfig: manualConfig.tipConfig || EMPTY_TIP_CONFIG,
    menu: EMPTY_MENU,
    label: sliceStore.name,
    location: manualConfig.location || null,
    backgroundImage:
      manualConfig.backgroundImage ||
      sliceStore.slicerConfig?.bannerImage ||
      sliceStore.image ||
      '',
    logo: manualConfig.logo || sliceStore.image || '',
    url: manualConfig.url || sliceStore.slicerConfig?.storefrontUrl || '',
    farmerAllocations: manualConfig.farmerAllocation || [],
  };
};

export const buildMenuFromSliceProducts = async (
  products: SliceProduct[],
): Promise<{ menu: Menu; items: Item[] }> => {
  // map every slice product to an item object and save
  const items = products.map(mapSliceProductCartToItem).filter(i => !!i);

  const menu = buildMenuFromItems(items);

  return { menu, items };
};
