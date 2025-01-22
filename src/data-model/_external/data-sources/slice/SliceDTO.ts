import { Entity } from '@/data-model/__global/entities';
import { Currency } from '@/data-model/_common/currency';
import { Cart } from '@/data-model/cart/CartType';
import { ChainId } from '@/data-model/ethereum/EthereumType';
import { Item, ItemVariant } from '@/data-model/item/ItemType';
import {
  deriveShopIdFromSliceStoreId,
  EMPTY_MENU,
  EMPTY_TIP_CONFIG,
  getSliceExternalIdFromSliceId,
} from '@/data-model/shop/ShopDTO';
import { Menu, Shop, ShopConfig } from '@/data-model/shop/ShopType';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import { genericError, mappingError } from '@/lib/effect';
import { isAddressEql } from '@/lib/ethereum';
import { generateUUID, hasAtLeastOne } from '@/lib/utils';
import {
  ExternalProduct,
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

/**
 * @dev the slice product cart has a dbId, but we want to derive our ids from this stable id
 */
const SLICE_PRODUCT_ID_TO_DERIVE_FROM: keyof SliceProduct = 'dbId';
/**
 * @dev the slice variant has an id, but we want to derive our ids from this stable id
 */
const SLICE_VARIANT_ID_TO_DERIVE_FROM: keyof SliceVariant = 'id';

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

export function deriveDripIdFromSliceVariantId(variant: SliceVariant) {
  return generateUUID(
    `SLICE_VARIANT:${variant[SLICE_VARIANT_ID_TO_DERIVE_FROM] || genericError('no product id')}`,
  );
}

export function deriveDripIdFromSliceProductId(product: SliceProduct) {
  return generateUUID(
    `SLICE_ITEM:${product[SLICE_PRODUCT_ID_TO_DERIVE_FROM] || genericError(`no DB id found on slice store ${product.slicerId} for item ${product.name}`)}`,
  );
}

export function deriveDripIdFromSliceExternalProduct(product: ExternalProduct) {
  return generateUUID(
    `SLICE_EXTERNAL_PRODUCT:${product.id || genericError(`no id found on slice store ${product.provider}`)}`,
  );
}

export function getPriceFromSliceCart(
  currencyAddress: string,
  priceString_wei: string,
): Currency | null {
  if (isAddressEql(zeroAddress, currencyAddress))
    return ETH.fromWei(priceString_wei);
  if (isAddressEql(USDC_CONFIG[ChainId.BASE].address, currencyAddress))
    return USDC.fromWei(priceString_wei);

  return null;
}

export const mapSliceProductCartToItem = (
  product: SliceProduct,
): Item | null => {
  const price: Currency =
    getPriceFromSliceCart(product.currency.address, product.basePrice) ||
    mappingError(
      `no price found on slice store ${product.slicerId} for ${product.name}`,
    );

  // skip items without external products
  if (!product.externalProduct) return null;

  const productVariants = (product.externalProduct?.providerVariants ?? [])
    .map<ItemVariant | null>(v => {
      if (v.isActive !== undefined && !v.isActive) return null;

      return {
        id: deriveDripIdFromSliceVariantId(v),
        __sourceConfig: {
          type: 'slice',
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

  const baseVariant: ItemVariant = {
    id: deriveDripIdFromSliceExternalProduct(product.externalProduct),
    __sourceConfig: {
      type: 'slice',
      id: product.externalProduct.id.toString(),
      version: SLICE_VERSION,
    },
    name: product.externalProduct.providerVariantName || product.name,
    description: product.description || '',
    image: product.images[0] || deriveDefaultImageFromItemName(product.name),
    price: price,
  };

  return {
    id: deriveDripIdFromSliceProductId(product),
    description: product.description || '',
    image: product.images[0] || deriveDefaultImageFromItemName(product.name),
    name: product.name,
    variants: hasAtLeastOne(productVariants) ? productVariants : [baseVariant],
    category: mapSliceProductToItemCategory(product),
  } satisfies Item;
};

export function mapCartToSliceCart(
  cart: Cart,
  sliceProducts: SliceProduct[],
): SliceProduct[] {
  const sliceCart = cart.lineItems.reduce<SliceProduct[]>((acc, li) => {
    const sliceProduct = sliceProducts.find(
      product => deriveDripIdFromSliceProductId(product) === li.item.id,
    );

    if (!sliceProduct) throw Error('slice product not found');
    const variant = li.mods?.[0]?.__sourceConfig.id;

    return [
      ...acc,
      {
        ...sliceProduct!,
        quantity: li.quantity,
        externalVariantId: variant ? +variant : undefined,
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
    id: deriveShopIdFromSliceStoreId(sliceStore.id, SLICE_VERSION),
    __entity: Entity.shop,
    __type: 'storefront',
    __sourceConfig: {
      type: 'slice',
      id: getSliceExternalIdFromSliceId(sliceStore.id),
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
