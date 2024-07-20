import { Order } from '@/data-model/order/OrderType';
import { getSlicerIdFromSliceStoreId } from '@/data-model/shop/ShopDTO';
import { Shop } from '@/data-model/shop/ShopType';
import { sliceKit } from '@/lib/slice';
import { ProductCart } from '@slicekit/core';
import { Address } from 'viem';

export const SLICE_VERSION = 1;

export type SliceStoreId = `SLICE_STORE::V${number}::${number}`;

export async function mapCartToSliceCart(
  cart: Order,
  shop: Shop,
  buyerAddress: Address,
): Promise<ProductCart[]> {
  const slicerId = getSlicerIdFromSliceStoreId(shop.sliceStoreId);

  const { cartProducts, storeClosed } = await sliceKit.getStoreProducts_proxied(
    {
      slicerId,
      buyer: buyerAddress,
    },
  );

  const sliceProducts = cart.orderItems.reduce<ProductCart[]>(
    (acc, orderItem) => {
      const product = cartProducts
        .filter(p => p?.externalProduct?.id !== undefined)
        .find(
          cartProduct =>
            cartProduct.externalProduct!.id.toString() === orderItem.item.id,
        );

      return product ? [...acc, product] : acc;
    },
    [],
  );

  return sliceProducts;
}
