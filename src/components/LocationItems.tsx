import { Item, ItemCategory } from '@/data-model/item/ItemType';
import { UUID } from 'crypto';
import { ItemWithSelector } from './ItemSelector';
import { cn } from '@/lib/utils';

export function ItemList({
  title,
  category,
  items,
  horizontal,
  cafeId,
}: {
  title: string;
  cafeId: UUID;
  category: ItemCategory;
  items: Item[];
  horizontal?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="py-3">
        <h2 className="text-lg font-normal">{title}</h2>
      </div>
      <div
        className={cn(
          'flex flex-row gap-5 w-full overflow-auto',
          horizontal ? 'flex-row' : 'flex-col',
        )}
      >
        {items.map((item, index) => (
          <ItemWithSelector
            key={index}
            item={item}
            category={category}
            cafeId={cafeId}
          />
        ))}
      </div>
    </div>
  );
}
