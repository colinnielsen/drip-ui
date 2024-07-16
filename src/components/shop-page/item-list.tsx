import { Item, ItemCategory } from '@/data-model/item/ItemType';
import { UUID } from 'crypto';
import { ItemWithSelector } from './item';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function ItemList({
  title,
  category,
  items,
  horizontal,
  shopId,
}: {
  title: string;
  category: ItemCategory;
  horizontal?: boolean;
  shopId?: UUID;
  items?: Item[];
}) {
  const ItemSkeleton = ({ count = 5 }: { count?: number }) => (
    <div className="flex gap-5 w-full overflow-x-auto">
      {Array.from({ length: count }).map((_, index) => (
        <div className="flex flex-col gap-2 bg-white">
          <Skeleton key={index} className="h-36 w-36 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!shopId || !items) {
    return (
      <div className="flex flex-col">
        <div className="py-3">
          <h2 className="text-lg font-normal">{title}</h2>
        </div>
        <ItemSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="py-3">
        <h2 className="text-lg font-normal">{title}</h2>
      </div>
      <div
        className={cn(
          'flex gap-5 w-full overflow-x-auto',
          horizontal ? 'flex-row' : 'flex-col',
        )}
      >
        {items.map((item, index) => (
          <ItemWithSelector
            key={index}
            item={item}
            category={category}
            shopId={shopId}
          />
        ))}
      </div>
    </div>
  );
}
