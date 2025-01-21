import { Entity } from '@/data-model/__global/entities';
import { Item } from '@/data-model/item/ItemType';
import { ItemMod } from '@/data-model/item/ItemMod';
import { createLineItemAggregate } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import {
  deriveShopIdFromSliceStoreId,
  EMPTY_MENU,
  EMPTY_TIP_CONFIG,
  getSliceExternalIdFromSliceId,
} from '@/data-model/shop/ShopDTO';
import { Menu, Shop, ShopConfig } from '@/data-model/shop/ShopType';
import { genericError } from '@/lib/effect';
import { isAddressEql, USDC_ADDRESS_BASE } from '@/lib/ethereum';
import { err, generateUUID } from '@/lib/utils';
import { ProductCart, SlicerBasics, Variant } from '@slicekit/core';
import { ETH } from '../../../_common/currency/ETH';
import { USDC } from '../../../_common/currency/USDC';
import { buildMenuFromItems } from '../common';
import { Currency } from '@/data-model/_common/currency';
import { Cart } from '@/data-model/cart/CartType';

export const SLICE_VERSION = 1;

/**
 * @dev the slice product cart has a dbId, but we want to derive our ids from this stable id
 */
const SLICE_PRODUCT_ID_TO_DERIVE_FROM: keyof ProductCart = 'dbId';

export function mapSliceVariantsToMods(variants: Variant[]): ItemMod[] {
  return variants.reduce<ItemMod[]>((acc, variant) => {
    if (variant.isActive === false) return acc;

    const uuid = generateUUID(variant.id.toString());
    const name = variant.variant;

    const mod: ItemMod = {
      id: uuid,
      __sourceConfig: {
        type: 'slice',
        id: variant.id.toString(),
        version: SLICE_VERSION,
      },
      name,
      type: 'exclusive',
      price: USDC.ZERO,
      currency: 'usdc',
      isOptional: true,
      category: null,
    };
    return [...acc, mod];
  }, []);
}

function determineCategory(product: ProductCart): Item['category'] {
  if (product?.category?.name)
    return product?.category?.name as Item['category'];

  if (product.description && product.description.includes('category:')) {
    const lines = product.description.split('\n');
    const category = lines.find(line => line.includes('category:'));
    const maybeCategpry = category?.split(':')?.[1]?.trim();
    if (maybeCategpry) return maybeCategpry as Item['category'];
  }

  return null;
}

function determineAvailability(product: ProductCart): Item['availability'] {
  const { isOnsite, isDelivery } = product;
  if (!isOnsite && !isDelivery) return 'online-only';
  if (!!isOnsite && !isDelivery) return 'onsite-only';
  if (!isOnsite && !!isDelivery) return 'delivery';
  if (isOnsite) return 'onsite-only';

  return err(
    `Unknown availability - slice likely has some bad data. Store ${product.slicerId} - Product ${product.dbId}`,
  );
}

export function deriveDripIdFromSliceProductId(product: ProductCart) {
  return generateUUID(
    'SLICE' + product[SLICE_PRODUCT_ID_TO_DERIVE_FROM]?.toString() ||
      genericError('no product id'),
  );
}

export function getPriceFromSliceCart(
  currencyAddress: string,
  priceString_wei: string,
): {
  currency: 'eth' | 'usdc';
  price: Currency;
} {
  const currency = isAddressEql(currencyAddress, USDC_ADDRESS_BASE)
    ? 'usdc'
    : 'eth';

  const price =
    currency === 'eth'
      ? ETH.fromWei(priceString_wei)
      : currency === 'usdc'
        ? USDC.fromWei(priceString_wei)
        : (() => {
            throw Error('Unknown currency');
          })();

  return {
    currency,
    price,
  };
}

export const mapSliceProductCartToItem = (product: ProductCart): Item => {
  const uuid = deriveDripIdFromSliceProductId(product);

  const { currency, price } = getPriceFromSliceCart(
    product.currency.address,
    product.basePrice,
  );

  const variants = product.externalProduct?.providerVariants ?? [];
  const hasVariants = variants.length > 0;

  return {
    id: uuid,
    __sourceConfig: {
      type: 'slice',
      id:
        product[SLICE_PRODUCT_ID_TO_DERIVE_FROM]?.toString() ||
        err(
          `no external product on store ${product.slicerId} - product ${product.dbId}`,
        ),
      version: SLICE_VERSION,
    },
    description: product.description,
    image: product.images[0] || '/drip.png',
    name: product.name,
    price,
    currency,
    availability: determineAvailability(product),
    category: determineCategory(product),
    mods: hasVariants ? mapSliceVariantsToMods(variants) : [],
  };
};

export function mapCartToSliceCart(
  cart: Cart,
  sliceProducts: ProductCart[],
): ProductCart[] {
  const sliceCart = cart.lineItems.reduce<ProductCart[]>((acc, li) => {
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
  sliceStore: SlicerBasics,
  manualConfig: ShopConfig,
): Shop => ({
  __entity: Entity.shop,
  __type: 'storefront',
  __sourceConfig: {
    type: 'slice',
    id: getSliceExternalIdFromSliceId(sliceStore.id),
    version: SLICE_VERSION,
  },
  id: deriveShopIdFromSliceStoreId(sliceStore.id, SLICE_VERSION),
  tipConfig: manualConfig.tipConfig || EMPTY_TIP_CONFIG,
  menu: EMPTY_MENU,
  label: sliceStore.name,
  location: manualConfig.location || null,
  backgroundImage: manualConfig.backgroundImage || sliceStore.image || '',
  logo: manualConfig.logo || sliceStore.image || '',
  url: manualConfig.url || sliceStore.slicerConfig?.storefrontUrl || '',
  farmerAllocations: manualConfig.farmerAllocation || [],
});

export const buildMenuFromSliceProducts = async (
  products: ProductCart[],
): Promise<{ menu: Menu; items: Item[] }> => {
  // map every slice product to an item object and save
  const items = products.map(mapSliceProductCartToItem);

  const menu = buildMenuFromItems(items);

  return { menu, items };
};
