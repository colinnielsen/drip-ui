import { DrawerProps, DrinkDrawer } from "./Drawer";
import { DrawerTrigger } from "./shadcn/drawer";
import { Price, PlusSvg } from "./Helpers";
import { Item, ItemCategory } from "@/data/types-TODO/item";
import { UUID } from "crypto";

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
  let className = horizontal
    ? "flex flex-row gap-5 w-full overflow-auto"
    : "flex flex-col gap-5 w-full";

  return (
    <div className="flex flex-col">
      <div className="py-3">
        <h2 className="text-lg font-normal">{title}</h2>
        <p className="text-sm text-neutral-500 font-normal"></p>
      </div>
      <div className={className}>
        {items.map((item, index) => (
          <DrinkDrawer
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
