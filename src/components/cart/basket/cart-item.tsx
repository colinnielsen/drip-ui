import { Skeleton } from '@/components/ui/skeleton';
import { getTotalItemCostBasedOnModSelection } from '@/data-model/order/OrderDTO';
import { OrderItem } from '@/data-model/order/OrderType';
import { useAddToCart, useRemoveItemFromCart } from '@/queries/OrderQuery';
import { UUID } from 'crypto';
import Image from 'next/image';
import { ReactNode } from 'react';
import { Price } from '../../ui/icons';
import { NumberInput } from '../../ui/number-input';
import { Headline, Label2 } from '../../ui/typography';

export function LoadingCartItem() {
  return (
    <div className="flex items-start gap-4 w-full px-6">
      <Skeleton className="rounded-2xl overflow-hidden h-24 w-24 relative aspect-square" />

      <div className="flex flex-col gap-y-1">
        <Skeleton>
          <Headline>loading...</Headline>
        </Skeleton>
        <div className="flex gap-y-1">
          {new Array(3).fill(null).map((_, index) => (
            <Skeleton key={index}>
              <Label2>loading...</Label2>
            </Skeleton>
          ))}
        </div>
        <Price />
      </div>
      <div className="flex-grow" />
    </div>
  );
}

export function OrderItemDisplay({
  orderItem,
  rightSide,
  isLoading,
}: {
  orderItem: OrderItem;
  rightSide?: ReactNode;
  isLoading?: boolean;
}) {
  const { price, discountPrice } =
    getTotalItemCostBasedOnModSelection(orderItem);
  return (
    <div className="flex items-start gap-4 w-full px-6">
      <div className="rounded-2xl overflow-hidden h-24 w-24 relative aspect-square">
        <Image
          src={orderItem.item.image}
          alt="coffee"
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <Headline>{orderItem.item.name}</Headline>
        <div className="flex gap-y-1">
          {orderItem.mods.map(m => (
            <Label2 key={m.id}>{m.name}</Label2>
          ))}
        </div>

        <Price {...{ price, discountPrice, isLoading }} />
      </div>
      <div className="flex-grow" />
      {rightSide && <div className="flex-1 justify-end flex">{rightSide}</div>}
    </div>
  );
}

export function CartItem({
  orderItem,
  quantity,
  orderId,
  shopId,
  isLoading,
}: {
  orderItem: OrderItem;
  quantity: number;
  orderId: UUID;
  shopId: UUID;
  isLoading?: boolean;
}) {
  const { id, ...orderItemWithoutId } = orderItem;
  const { mutate: addAnother } = useAddToCart({
    shopId,
    orderItem: orderItemWithoutId,
  });
  const { mutate: removeItem } = useRemoveItemFromCart({
    orderItemId: orderItem.id,
    orderId,
    shopId,
  });

  return (
    <OrderItemDisplay
      orderItem={orderItem}
      isLoading={isLoading}
      rightSide={
        <NumberInput
          value={quantity}
          useTrashForDelete
          onPlus={() => addAnother(orderId)}
          onMinus={removeItem}
        />
      }
    />
  );
}
