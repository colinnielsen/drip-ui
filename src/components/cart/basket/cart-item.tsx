import { OrderItem } from '@/data-model/order/OrderType';
import Image from 'next/image';
import { Price } from '../../icons';
import { Headline, Label2 } from '../../ui/typography';
import { NumberInput } from '../../ui/number-input';
import { useAddToCart, useRemoveItemFromCart } from '@/queries/OrderQuery';
import { UUID } from 'crypto';
import { ReactNode } from 'react';

export function OrderItemDisplay({
  orderItem,
  rightSide,
}: {
  orderItem: OrderItem;
  rightSide?: ReactNode;
}) {
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
        <Price {...orderItem.item} />
      </div>
      <div className="flex-grow" />
      {rightSide && <div className="flex-1 justify-end flex">{rightSide}</div>}
    </div>
  );
}

export function CartItem({
  orderItem,
  quantity,
  userId,
  shopId,
}: {
  orderItem: OrderItem;
  quantity: number;
  userId: UUID;
  shopId: UUID;
}) {
  const { id, ...orderItemWithoutId } = orderItem;
  const { mutate: addAnother } = useAddToCart({
    shopId,
    userId,
    orderItem: orderItemWithoutId,
  });
  const { mutate: removeItem } = useRemoveItemFromCart({
    orderItemId: orderItem.id,
    userId,
    shopId,
  });

  return (
    <OrderItemDisplay
      orderItem={orderItem}
      rightSide={
        <NumberInput
          value={quantity}
          useTrashForDelete
          onPlus={addAnother}
          onMinus={removeItem}
        />
      }
    />
  );
}
