import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Unsaved } from "@/data-model/_common/type/CommonType";
import { Item, ItemCategory, ItemMod } from "@/data-model/item/ItemType";
import { OrderItem } from "@/data-model/order/OrderType";
import { useCategoryOptions } from "@/queries/CafeQuery";
import { useAddToCart, useCart } from "@/queries/OrderQuery";
import { useActiveUser } from "@/queries/UserQuery";
import { UUID } from "crypto";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { PlusSvg, Price } from "./Helpers";
import { Checkbox } from "./ui/checkbox";

export type DrawerProps = {
  item: Item;
  category: ItemCategory;
  cafeId: UUID;
};

export function NumberInput({
  onPlus,
  onMinus,
  value,
}: {
  onPlus: () => void;
  onMinus: () => void;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 font-normal text-sm bg-neutral-100 w-fit rounded-2xl">
      <button onClick={onMinus}>
        <Minus />
      </button>
      <p>{value}</p>
      <button onClick={onPlus}>
        <Plus />
      </button>
    </div>
  );
}

type DrinkMods = {
  category: ItemCategory;
  options: ItemMod[];
};

export function OptionInput({ option }: { option: ItemMod }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-b-gray-50">
      <div className="flex gap-2 items-center w-full">
        {option.type === "boolean" && (
          <Checkbox id={option.name} className="w-5 h-5" />
        )}
        <label className="w-full" htmlFor={option.name}>
          {option.name}
        </label>
        {option.type === "number" && (
          <input
            type="number"
            id={option.name}
            name={option.name}
            min={0}
            max={10}
            step={1}
            className="w-12 h-8 border border-black rounded-md justify-self-start"
          />
        )}
      </div>
      {option.price ? <Price price={option.price} /> : null}
    </div>
  );
}

export function DrinkOptions({ category, options }: DrinkMods) {
  // Upper case the first letter of the category
  const prettyCategory = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="flex flex-col">
        <h3 className="font-semibold font-sans text-lg">{prettyCategory}</h3>
        {options.map((option) => (
          <OptionInput key={option.name} option={option} />
        ))}
      </div>
    </div>
  );
}

function AddToBasketButton({
  userId,
  cafeId,
  orderItem,
}: {
  userId: UUID;
  cafeId: UUID;
  orderItem: Unsaved<OrderItem>;
}) {
  const { data: maybeCart } = useCart(userId);
  const { mutate } = useAddToCart({
    cafeId,
    userId,
    orderItem,
    orderId: maybeCart?.id,
  });

  return (
    <DrawerFooter>
      <DrawerClose asChild>
        <Button
          className="bg-black text-white rounded-3xl py-6"
          onClick={() => mutate()}
        >
          Add to Basket
        </Button>
      </DrawerClose>
    </DrawerFooter>
  );
}

export function ItemPreviewTrigger({ name, image, price }: Item) {
  return (
    <div className="flex flex-col gap-2 bg-white">
      <DrawerTrigger asChild>
        <div className="relative overflow-hidden rounded-xl h-36 w-36">
          <Image src={image} alt={name} fill />
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

export function ItemWithSelector({ item, category, cafeId }: DrawerProps) {
  const [quantity, setQuantity] = useState(1);

  const { data: user } = useActiveUser();
  const query = useCategoryOptions(cafeId, category);

  const options = Array.from(query.data ?? []);

  const orderItem: Unsaved<OrderItem> = {
    item,
    mods: [],
  };

  return (
    <Drawer>
      <ItemPreviewTrigger {...item} />
      <DrawerContent className="border-none rounded-t-xl overflow-hidden">
        <div className="h-[75vh] overflow-y-scroll">
          <DrawerHeader className="p-0 rounded-t-xl">
            <div className="min-h-64 relative rounded-t-xl">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                quality={30}
              />
            </div>
            <DrawerTitle className="text-left pl-4 pt-4  font-sans font-medium text-[24px]">
              {item.name}
            </DrawerTitle>
            <div className="pl-4">
              <Price price={item.price} />
            </div>
            <NumberInput
              onPlus={() => setQuantity(quantity + 1)}
              onMinus={() => quantity && setQuantity(quantity - 1)}
              value={quantity}
            />
            {/* <RadioGroupDemo /> */}
          </DrawerHeader>
          {options
            .filter(([, options]) => options.length > 0)
            .map(([category, options]) => (
              <DrinkOptions
                key={`${category}-${options}`}
                category={category}
                options={options}
              />
            ))}
          {user?.id && (
            <AddToBasketButton {...{ userId: user.id, cafeId, orderItem }} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
