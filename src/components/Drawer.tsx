import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CoffeeCard } from "./LocationItems";
import { Price } from "./Helpers";
import { Checkbox } from "./ui/checkbox";

export type DrawerProps = {
  item: Item;
  itemOptions: ItemOption[];
  category: ItemCategory;
};

export function DrinkDrawer({ item, itemOptions, category }: DrawerProps) {
  const [quantity, setQuantity] = React.useState(1);
  return (
    <Drawer>
      <CoffeeCard {...item} />
      <DrawerContent className="border-none rounded-t-xl">
        <div className="max-h-[75vh] overflow-y-scroll">
          <DrawerHeader className="p-0 rounded-t-xl">
            <div className="h-32 relative rounded-t-xl overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="absolute bottom-0"
              />
            </div>
            <DrawerTitle className="text-left pl-4 pt-4  font-sans font-medium text-[24px]">
              {item.name}
            </DrawerTitle>
            <div className="pl-4">
              <Price price={item.price} />
            </div>
            <div className="pl-4">
              <div className="flex items-center gap-2 px-4 py-2 font-normal text-sm bg-neutral-100 w-fit rounded-2xl">
                <button onClick={() => setQuantity(quantity - 1)}>
                  <Minus />
                </button>
                <p>{quantity}</p>
                <button onClick={() => setQuantity(quantity + 1)}>
                  <Plus />
                </button>
              </div>
            </div>
            <RadioGroupDemo />
          </DrawerHeader>
          <DrinkOptions category={category} options={itemOptions} />
          <DrawerFooter>
            <DrawerClose asChild>
              <Button className="bg-black text-white rounded-3xl py-6">
                Add to Basket
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

type DrinkMods = {
  category: string;
  options: ItemOption[];
};

export function DrinkOptions({ category, options }: DrinkMods) {
  return (
    <div className="p-4 flex flex-col gap-5">
      <div key={category} className="flex flex-col">
        <h3 className="font-semibold font-sans text-lg">{category}</h3>
        {options.map((option) => (
          <div
            className="flex justify-between items-center pt-4"
            key={`${category}:${option.name}`}
          >
            <div className="flex gap-2 items-center w-full">
              <Checkbox id={`${category}:${option.name}`} className="w-5 h-5" />
              <label className="w-full" htmlFor={`${category}:${option.name}`}>
                {option.name}
              </label>
            </div>
            <Price price={option.price} />
          </div>
        ))}
      </div>
    </div>
  );
}

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Item, ItemCategory, ItemOption } from "@/data/types-TODO/item";

export function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue="pickup" className="p-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="pickup" id="r1" />
        <Label htmlFor="r1" className=" font-medium text-md">
          Pickup at: 123 Your Moms Rd. 69420, CA
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="delivery" id="r2" />
        <Label htmlFor="r2" className=" font-medium text-md">
          Delivery (1.0 mi $5.00)
        </Label>
      </div>
    </RadioGroup>
  );
}
