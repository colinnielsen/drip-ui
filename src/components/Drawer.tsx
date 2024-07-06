import { useState } from "react";
import { Minus, Plus } from "lucide-react";
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
import { PlusSvg, Price } from "./Helpers";
import { Checkbox } from "./ui/checkbox";
import { NumericOption, BooleanOption } from "@/data-model/types-TODO/item";

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

export function DrinkWithSelector({ item, category, cafeId }: DrawerProps) {
  const [quantity, setQuantity] = useState(1);

  const query = useCategoryOptions(cafeId, category);

  const options = Array.from(query.data ?? []);

  return (
    <Drawer>
      <CoffeeCard {...item} />
      <DrawerContent className="border-none rounded-t-xl">
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
              onMinus={() => setQuantity(quantity - 1)}
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
  category: ItemCategory;
  options: ItemOption[];
};

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

export function OptionInput({ option }: { option: ItemOption }) {
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

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Item, ItemCategory, ItemOption } from "@/data-model/types-TODO/item";
import { UUID } from "crypto";
import { useCategoryOptions } from "@/infras/database";
import Image from "next/image";

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

export function CoffeeCard({ name, image, price }: Item) {
  return (
    <div className="flex flex-col gap-2 bg-white">
      <DrawerTrigger asChild className="overflow-hidden">
        <div className="relative overflow-hidden rounded-xl h-36 w-36">
          <Image src={image} alt={name} fill className="overflow-hidden" />
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
