import { Skeleton } from '@/components/ui/skeleton';
import { UUID } from '@/data-model/_common/type/CommonType';
import { Item } from '@/data-model/item/ItemType';
import { cn } from '@/lib/utils';
import { ClientOnly } from '../ui/client-only';
import { Drawer } from '../ui/drawer';
import { ItemDetailsProvider, useItemDetails } from './item-details-context';
import { ItemCard, ItemDetailsDrawer } from './item-popup';

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

const ItemDrawer = ({ items, shopId }: { items: Item[]; shopId: UUID }) => {
  const { open, setOpen } = useItemDetails();

  return (
    <Drawer open={open} dismissible={true} onOpenChange={setOpen}>
      {items.map((item, index) => (
        <ItemCard key={index + item.id} item={item} shopId={shopId} />
      ))}
      <ItemDetailsDrawer />
    </Drawer>
  );
};

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
            <ItemDetailsProvider shopId={shopId}>
              <ItemDrawer items={items} shopId={shopId} />
            </ItemDetailsProvider>
          </ClientOnly>
        </div>
      )}
    </div>
  );
}
