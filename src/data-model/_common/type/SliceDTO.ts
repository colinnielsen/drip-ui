import { Item, ItemMod } from '@/data-model/item/ItemType';
import { collapseDuplicateItems } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { USDC_ADDRESS_BASE } from '@/lib/ethereum';
import { err, generateUUID } from '@/lib/utils';
import { isAddressEql } from '@/lib/ethereum';
import { ProductCart, Variant, generateCart } from '@slicekit/core';
import { formatUnits } from 'viem';

export const SLICE_VERSION = 1;

export type SliceStoreId = `SLICE_STORE::V${number}::${number}`;

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
      price: '0',
      prettyPrice: '0',
      currency: 'usdc',
      currencyDecimals: 6,
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

export const mapSliceProductCartToItem = (product: ProductCart): Item => {
  const uuid = generateUUID(
    product[SLICE_PRODUCT_ID_TO_DERIVE_FROM].toString(),
  );

  const isUSDC = isAddressEql(product.currency, USDC_ADDRESS_BASE);

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
    price: product.basePrice,
    prettyPrice: formatUnits(BigInt(product.basePrice), 6),
    currency: isUSDC ? 'usdc' : 'eth',
    currencyDecimals: isUSDC ? 6 : 18,
    availability: determineAvailability(product),
    category: determineCategory(product),
    mods: hasVariants ? mapSliceVariantsToMods(variants) : [],
  };
};

export function mapCartToSliceCart(
  cart: Order,
  sliceProducts: ProductCart[],
): ProductCart[] {
  const sliceCart = collapseDuplicateItems(cart.orderItems).reduce(
    (acc, [orderItem, quantity]) => {
      const sliceProduct = sliceProducts.find(
        product =>
          product[SLICE_PRODUCT_ID_TO_DERIVE_FROM]?.toString() ===
          orderItem.item.__sourceConfig.id,
      );

      if (!sliceProduct) throw Error('slice product not found');
      const variant = orderItem.mods?.[0]?.__sourceConfig.id;
      return [
        ...acc,
        {
          ...sliceProduct!,
          quantity,
          variant,
        },
      ];
    },
    [] as ProductCart[],
  );
  // const sliceCart = generateCart({ cartParams, allProducts: sliceProducts });

  return sliceCart;
}
