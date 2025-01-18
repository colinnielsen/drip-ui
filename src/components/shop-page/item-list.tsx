import { Skeleton } from '@/components/ui/skeleton';
import { UUID } from '@/data-model/_common/type/CommonType';
import { Item } from '@/data-model/item/ItemType';
import { cn } from '@/lib/utils';
import { ClientOnly } from '../ui/client-only';
import { ItemWithSelector } from './item-popup';

export const ItemSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-5 w-full overflow-x-auto">
    {Array.from({ length: count }).map((_, index) => (
      <div className="flex flex-col gap-2" key={index}>
        <Skeleton className="h-36 w-36 flex-shrink-0" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export function ItemList({
  title,
  items,
  horizontal,
  shopId,
}: {
  title: string;
  horizontal?: boolean;
  shopId?: UUID;
  items?: Item[];
}) {
  const isLoading = !shopId || !items;

  return (
    <div className="flex flex-col">
      <div className="py-3">
        <h2 className="text-lg font-normal capitalize">{title}</h2>
      </div>
      {isLoading ? (
        <ItemSkeleton />
      ) : (
        <div
          className={cn(
            'flex gap-5 w-full overflow-x-auto',
            horizontal ? 'flex-row' : 'flex-col',
          )}
        >
          <ClientOnly>
            {items.map((item, index) => (
              <ItemWithSelector key={index} item={item} shopId={shopId} />
            ))}
          </ClientOnly>
        </div>
      )}
    </div>
  );
}
