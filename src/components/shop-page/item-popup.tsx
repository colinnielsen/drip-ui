import { CTAButton } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Unsaved } from '@/data-model/_common/type/CommonType';
import { convertItemPriceToBigInt } from '@/data-model/item/ItemDTO';
import { Item, ItemCategory, ItemMod } from '@/data-model/item/ItemType';
import { OrderItem } from '@/data-model/order/OrderType';
import { useAddToCart } from '@/queries/OrderQuery';
import { useActiveUser } from '@/queries/UserQuery';
import { UUID } from 'crypto';
import Image from 'next/image';
import { Dispatch, SetStateAction, useState } from 'react';
import { PlusSvg, Price } from '../icons';
import { Checkbox } from '../ui/checkbox';
import { Divider } from '../ui/divider';
import { NumberInput } from '../ui/number-input';
import { Skeleton } from '../ui/skeleton';
import { Body, Headline, Label2, Title1 } from '../ui/typography';

type CategorySections = ItemCategory | '__misc__';
type ModSection = { [key in CategorySections]: ItemMod[] };

function AddToBasketButton({
  userId,
  shopId,
  orderItem,
}: {
  userId: UUID;
  shopId: UUID;
  orderItem: Unsaved<OrderItem>;
}) {
  const { mutate } = useAddToCart({
    shopId,
    userId,
    orderItem,
  });

  return (
    <DrawerFooter>
      <DrawerClose asChild>
        <CTAButton onClick={() => mutate()}>Add to Basket</CTAButton>
      </DrawerClose>
    </DrawerFooter>
  );
}

export const AddButton = ({
  shopId,
  userId,
  item,
}: {
  shopId: UUID;
  userId: UUID;
  item: Item;
}) => {
  const { mutate } = useAddToCart({
    shopId,
    userId,
    orderItem: {
      item,
      mods: [],
    },
  });

  return (
    <button
      className="bg-white rounded-full h-7 w-7 flex justify-center items-center absolute bottom-4 right-2 hover:bg-neutral-200 active:bg-neutral-300 active:scale-95 drop-shadow-md"
      onClick={e => {
        e.stopPropagation();
        mutate();
      }}
    >
      <PlusSvg />
    </button>
  );
};

export function ItemPreviewTrigger({
  shopId,
  item,
}: {
  shopId: UUID;
  item: Item;
}) {
  const { data: user } = useActiveUser();

  const { image, name } = item;

  return (
    <DrawerTrigger asChild>
      <div className="flex flex-col gap-2">
        <div className="relative overflow-hidden rounded-xl h-36 w-36">
          <Image src={image} alt={name} fill />
          {user?.id ? (
            <AddButton {...{ shopId, userId: user.id, item }} />
          ) : (
            <Skeleton className="h-7 w-7 rounded-full" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{name}</h3>
          <Price {...item} />
        </div>
      </div>
    </DrawerTrigger>
  );
}

export const ItemOption = ({
  mod,
  setSelectedOptions,
  selectedOptions,
}: {
  mod: ItemMod;
  setSelectedOptions: Dispatch<
    SetStateAction<
      Record<`${string}-${string}-${string}-${string}-${string}`, ItemMod>
    >
  >;
  selectedOptions: Record<UUID, ItemMod>;
}) => {
  const checked = !!selectedOptions[mod.id];
  // const [quantity, setQuantity] = useState(0);
  function selectBooleanMod(checked: boolean) {
    setSelectedOptions(prev => {
      if (!checked) {
        const { [mod.id]: _, ...next } = prev;
        return next;
      }

      if (mod.type === 'exclusive') {
        const previousWithoutSameCategory = Object.values(prev)
          .filter(m => m.category !== mod.category)
          .reduce<Record<UUID, ItemMod>>((acc, m) => {
            acc[m.id] = m;
            return acc;
          }, {});

        return {
          ...previousWithoutSameCategory,
          [mod.id]: {
            ...mod,
            value: !!checked,
          },
        };
      } else
        return {
          ...prev,
          [mod.id]: {
            ...mod,
            value: !!checked,
          },
        };
    });
  }

  // function selectNumericOption(value: number) {
  //   setQuantity(value);
  //   setSelectedOptions(prev => {
  //     if (value === 0) {
  //       const { [option.id]: _, ...next } = prev;
  //       return next;
  //     }
  //     return {
  //       ...prev,
  //       [option.id]: {
  //         ...option,
  //         value,
  //       },
  //     };
  //   });
  // }

  // if (option.type === 'boolean') option.value;
  // else option.value;

  return (
    <>
      <div className="flex justify-between items-center py-4 border-b border-b-gray-50">
        <div className="flex gap-2 items-center w-full">
          <Checkbox
            id={mod.name}
            checked={checked}
            className="w-5 h-5"
            onCheckedChange={selectBooleanMod}
          />
          <div className="w-full flex gap-x-2 items-center">
            <label htmlFor={mod.name}>{mod.name}</label>
            {/* {option.type === 'number' && (
              <NumberInput
                id={option.name}
                value={quantity}
                onPlus={() => quantity < 4 && selectNumericOption(quantity + 1)}
                onMinus={() => quantity && selectNumericOption(quantity - 1)}
              />
            )} */}
          </div>
        </div>
        {convertItemPriceToBigInt(mod) > 0 ? <Price {...mod} /> : null}
      </div>
    </>
  );
};

export function ModSection({
  mods,
  category,
  setSelectedOptions,
  selectedOptions,
}: {
  mods: ItemMod[];
  category: CategorySections;
  setSelectedOptions: Dispatch<SetStateAction<Record<UUID, ItemMod>>>;
  selectedOptions: Record<UUID, ItemMod>;
}) {
  const label = category === '__misc__' ? 'Options' : category;

  return (
    <>
      <Divider />
      <div className="px-4 py-6">
        <Headline>{label}</Headline>
        {mods?.map((mod, i) => (
          <ItemOption
            key={i}
            {...{ mod, setSelectedOptions, selectedOptions }}
          />
        ))}
      </div>
    </>
  );
}

export function ItemWithSelector({
  item,
  shopId,
}: {
  item: Item;
  shopId: UUID;
}) {
  const [quantity, setQuantity] = useState(1);

  const [selectedOptions, setSelectedOptions] = useState<Record<UUID, ItemMod>>(
    {},
  );

  const reset = () => {
    setQuantity(1);
    setSelectedOptions({});
  };

  const { data: user } = useActiveUser();

  const orderItem: Unsaved<OrderItem> = {
    item,
    mods: Object.values(selectedOptions),
  };

  const modSections = item.mods.reduce((acc, mod) => {
    if (!acc[mod?.category || '__misc__'])
      acc[mod?.category || '__misc__'] = [];
    acc[mod.category || '__misc__'].push(mod);
    return acc;
  }, {} as ModSection);

  return (
    <Drawer onClose={reset}>
      <ItemPreviewTrigger item={item} shopId={shopId} />

      <DrawerContent>
        <div className="h-[75vh] flex flex-col overflow-scroll">
          <DrawerHeader className="p-0 rounded-t-xl">
            <div className="min-h-64 relative rounded-t-xl overflow-clip">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                quality={100}
              />
            </div>
            <div className="flex flex-col px-6 py-4 gap-y-2">
              <Title1 className="text-left">{item.name}</Title1>

              <Price {...item} />

              <NumberInput
                onPlus={() => setQuantity(quantity + 1)}
                onMinus={() => quantity > 1 && setQuantity(quantity - 1)}
                value={quantity}
              />
            </div>
            {/* <RadioGroupDemo /> */}
          </DrawerHeader>

          {item.description && (
            <>
              <Divider />
              <div className="px-4 py-6 flex flex-col gap-y-2">
                <Headline>Description</Headline>
                <Body className="text-left">{item.description}</Body>
              </div>
            </>
          )}

          {Object.entries(modSections)
            .filter(([, mods]) => mods.length > 0)
            .map(([category, mods], i) => (
              <ModSection
                key={i}
                mods={mods}
                category={category as CategorySections}
                selectedOptions={selectedOptions}
                setSelectedOptions={setSelectedOptions}
              />
            ))}

          <div className="flex-grow" />

          {user?.id && (
            <AddToBasketButton {...{ userId: user.id, shopId, orderItem }} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
