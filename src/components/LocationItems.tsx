import { DrawerProps, DrinkDrawer } from "./Drawer";
import { DrawerTrigger } from "./ui/drawer";
import { Price, PlusSvg } from "./Helpers";
import { Item, ItemCategory } from "@/data/types-TODO/item";

export function ItemList({
  title,
  category,
  description,
  items,
}: {
  title: string;
  category: ItemCategory;
  description: string;
  items: Item[];
}) {
  return (
    <div className="flex flex-col">
      <div className="py-3">
        <h2 className="text-lg font-normal">{title}</h2>
        <p className="text-sm text-neutral-500 font-normal"></p>
      </div>
      <div className="flex flex-col w-full gap-5">
        {items.map((item, index) => (
          <DrinkDrawer
            key={index}
            itemOptions={[]}
            item={item}
            category={category}
          />
        ))}
      </div>
    </div>
  );
}

export function CoffeeCard({ name, image, price }: Item) {
  return (
    <div className="flex flex-col gap-2 bg-white w-full ">
      <DrawerTrigger asChild className="overflow-hidden">
        <div className="relative overflow-hidden h-24 rounded-xl">
          <img src={image} alt={name} className="rounded-xl" />
          <button className="bg-white rounded-full h-7 w-7 flex justify-center items-center absolute bottom-4 right-2 hover:bg-neutral-200 active:scale-95">
            <PlusSvg />
          </button>
        </div>
      </DrawerTrigger>
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">{name}</h3>
        <Price price={price} />
      </div>
    </div>
  );
}
