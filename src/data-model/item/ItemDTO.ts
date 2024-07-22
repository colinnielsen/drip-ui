import { USDC_ADDRESS_BASE } from '@/lib/constants';
import { generateUUID, isAddressEql, never } from '@/lib/utils';
import { ProductCart, Variant } from '@slicekit/core';
import { formatUnits } from 'viem';
import { Item, ItemMod } from './ItemType';

const ID_TO_DERIVE_FROM: keyof ProductCart = 'dbId';

function determineAvailability(product: ProductCart): Item['availability'] {
  const { isOnsite, isDelivery } = product;
  if (!isOnsite && !isDelivery) return 'online-only';
  if (!!isOnsite && !isDelivery) return 'onsite-only';
  if (!isOnsite && !!isDelivery) return 'delivery';
  if (isOnsite) return 'onsite-only';

  return never(
    `Unknown availability - slice likely has some bad data. Store ${product.slicerId} - Product ${product.dbId}`,
  );
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

function mapVariantsToMods(variants: Variant[]): ItemMod[] {
  return variants.reduce<ItemMod[]>((acc, variant) => {
    if (variant.isActive === false) return acc;

    const uuid = generateUUID(variant.id.toString());
    const name = variant.variant;

    const mod: ItemMod = {
      id: uuid,
      sliceId: variant.id.toString(),
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

export const mapSliceProductCartToItem = (product: ProductCart): Item => {
  const uuid = generateUUID(product[ID_TO_DERIVE_FROM].toString());

  const isUSDC = isAddressEql(product.currency, USDC_ADDRESS_BASE);

  const variants = product.externalProduct?.providerVariants ?? [];
  const hasVariants = variants.length > 0;

  return {
    id: uuid,
    sliceId:
      product.externalProduct?.id.toString() ||
      never(
        `no external product on store ${product.slicerId} - product ${product.dbId}`,
      ),
    description: product.description,
    image: product.images[0],
    name: product.name,
    price: product.basePrice,
    prettyPrice: formatUnits(BigInt(product.basePrice), 6),
    currency: isUSDC ? 'usdc' : 'eth',
    currencyDecimals: isUSDC ? 6 : 18,
    availability: determineAvailability(product),
    category: determineCategory(product),
    mods: hasVariants ? mapVariantsToMods(variants) : [],
  };
};

export const convertItemPriceToBigInt = (item: Item | ItemMod): bigint =>
  BigInt(item.price);
