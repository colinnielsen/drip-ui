import { Skeleton } from '@/components/ui/skeleton';
import { UUID } from '@/data-model/_common/type/CommonType';
import { LineItem } from '@/data-model/order/LineItemAggregate';
import { cn } from '@/lib/utils';
import { useAddToCart, useDecrementLineItem } from '@/queries/CartQuery';
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
  lineItem,
  rightSide,
  // originalPrice,
  // actualPrice,
  isLoading,
}: {
  lineItem: LineItem;
  // originalPrice: Currency;
  // actualPrice: Currency;
  rightSide?: ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 w-full px-6 py-4">
      <div className="rounded-2xl overflow-hidden h-24 w-24 relative aspect-square">
        <Image
          src={lineItem.item.image}
          alt={lineItem.item.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <Headline>{lineItem.item.name}</Headline>
        <div className="flex gap-y-1">
          {[lineItem.variant, ...(lineItem.mods || [])]?.map((m, i) => (
            <Label2 key={m.id} className={cn({ 'font-semibold': i === 0 })}>
              {m.name}
            </Label2>
          ))}
        </div>

        <Price
          {...{
            originalPrice: lineItem.subtotal,
            actualPrice: lineItem.total,
            isLoading,
          }}
        />
      </div>
      <div className="flex-grow" />
      {rightSide && <div className="flex-1 justify-end flex">{rightSide}</div>}
    </div>
  );
}

export function LineItemComponent({
  lineItem,
  shopId,
  isLoading,
}: {
  lineItem: LineItem;
  shopId: UUID;
  isLoading?: boolean;
}) {
  const { mutate: addAnother } = useAddToCart({
    shopId,
  });

  const { mutate: removeItem } = useDecrementLineItem();

  // if (!priceDict) return <LoadingCartItem />;

  const rightSide = (
    <NumberInput
      value={lineItem.quantity}
      useTrashForDelete
      onPlus={() =>
        addAnother({
          item: lineItem.item,
          variant: lineItem.variant,
          quantity: 1,
          mods: lineItem.mods || [],
        })
      }
      onMinus={() =>
        removeItem({
          lineItemUniqueId: lineItem.uniqueId,
        })
      }
    />
  );

  return (
    <OrderItemDisplay
      lineItem={lineItem}
      isLoading={isLoading}
      rightSide={rightSide}
    />
  );
}
