import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Unsaved } from '@/data-model/_common/type/CommonType';
import { Item, ItemCategory, ItemMod } from '@/data-model/item/ItemType';
import { OrderItem } from '@/data-model/order/OrderType';
import { useAddToCart, useCart } from '@/queries/OrderQuery';
import { useActiveUser } from '@/queries/UserQuery';
import { UUID } from 'crypto';
import Image from 'next/image';
import { Dispatch, SetStateAction, useState } from 'react';
import { PlusSvg, Price } from '../Helpers';
import { NumberInput } from '../base/NumberInput';
import { Checkbox } from '../ui/checkbox';
import { useItemMods } from '@/queries/ShopQuery';

export type DrawerProps = {
  item: Item;
  category: ItemCategory;
  shopId: UUID;
};

function AddToBasketButton({
  userId,
  shopId,
  orderItem,
}: {
  userId: UUID;
  shopId: UUID;
  orderItem: Unsaved<OrderItem>;
}) {
  const { data: maybeCart } = useCart(userId);
  const { mutate } = useAddToCart({
    shopId,
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

export const ItemOption = ({
  option,
  setSelectedOptions,
}: {
  option: ItemMod;
  setSelectedOptions: Dispatch<
    SetStateAction<
      Record<`${string}-${string}-${string}-${string}-${string}`, ItemMod>
    >
  >;
}) => {
  const [quantity, setQuantity] = useState(0);
  function selectBooleanMod(checked: boolean) {
    setSelectedOptions(prev => {
      if (!checked) {
        const { [option.id]: _, ...next } = prev;
        return next;
      }
      return {
        ...prev,
        [option.id]: {
          ...option,
          value: !!checked,
        },
      };
    });
  }

  function selectNumericOption(value: number) {
    setQuantity(value);
    setSelectedOptions(prev => {
      if (value === 0) {
        const { [option.id]: _, ...next } = prev;
        return next;
      }
      return {
        ...prev,
        [option.id]: {
          ...option,
          value,
        },
      };
    });
  }

  if (option.type === 'boolean') option.value;
  else option.value;

  return (
    <>
      <div className="flex justify-between items-center py-4 border-b border-b-gray-50">
        <div className="flex gap-2 items-center w-full">
          {option.type === 'boolean' && (
            <Checkbox
              id={option.name}
              className="w-5 h-5"
              onCheckedChange={selectBooleanMod}
            />
          )}
          <div className="w-full flex gap-x-2 items-center">
            <label htmlFor={option.name}>{option.name}</label>
            {option.type === 'number' && (
              <NumberInput
                id={option.name}
                value={quantity}
                onPlus={() => quantity < 4 && selectNumericOption(quantity + 1)}
                onMinus={() => quantity && selectNumericOption(quantity - 1)}
              />
            )}
          </div>
        </div>
        {option.price ? <Price price={option.price} /> : null}
      </div>
    </>
  );
};

export function ItemWithSelector({ item, category, shopId }: DrawerProps) {
  const [quantity, setQuantity] = useState(1);

  const [selectionOptions, setSelectedOptions] = useState<
    Record<UUID, ItemMod>
  >({});

  const { data: user } = useActiveUser();
  const { data: itemMods } = useItemMods(shopId, category);

  const options = Array.from(itemMods ?? []);

  const orderItem: Unsaved<OrderItem> = {
    item,
    mods: Object.values(selectionOptions),
  };

  return (
    <Drawer>
      <ItemPreviewTrigger {...item} />
      <DrawerContent className="border-none rounded-t-xl overflow-hidden">
        <div className="h-[75vh] overflow-y-scroll">
          {/* <pre className="text-xs">
            {JSON.stringify(orderItem.mods, null, 2)}
          </pre> */}
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
          {/* {options
            .filter(([, o]) => o.length > 0)
            .map(([category, options]) => {
              // Upper case the first letter of the category
              const prettyCategory =
                category.charAt(0).toUpperCase() + category.slice(1);

              return (
                <div
                  key={`${category}-${options}`}
                  className="p-4 flex flex-col gap-5"
                >
                  <div className="flex flex-col">
                    <h3 className="font-semibold font-sans text-lg">
                      {prettyCategory}
                    </h3>
                    {options.map((option, i) => (
                      <ItemOption key={i} {...{ option, setSelectedOptions }} />
                    ))}
                  </div>
                </div>
              );
            })} */}
          {user?.id && (
            <AddToBasketButton {...{ userId: user.id, shopId, orderItem }} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
