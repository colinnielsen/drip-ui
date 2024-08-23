import { CTAButton } from '@/components/ui/button';
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
import { useAddToCart, useRecentCart } from '@/queries/OrderQuery';
import { UUID } from 'crypto';
import Image from 'next/image';
import { Dispatch, SetStateAction, useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { Divider } from '../ui/divider';
import { PlusSvg, Price } from '../ui/icons';
import { NumberInput } from '../ui/number-input';
import { Skeleton } from '../ui/skeleton';
import { Body, Headline, Title1 } from '../ui/typography';
import { useShop } from '@/queries/ShopQuery';

type CategorySections = ItemCategory | '__misc__';
type ModSection = { [key in CategorySections]: ItemMod[] };

function AddToBasketButton({
  orderId,
  shopId,
  orderItem,
}: {
  orderId?: UUID;
  shopId: UUID;
  orderItem: Unsaved<OrderItem[]>;
}) {
  const { mutate } = useAddToCart({
    shopId,
  });

  return (
    <DrawerFooter className="bottom-0 sticky bg-white shadow-drawer-secondary">
      <DrawerClose asChild>
        <CTAButton onClick={e => mutate({ orderItem })}>Add to Cart</CTAButton>
      </DrawerClose>
    </DrawerFooter>
  );
}

export const AddButton = ({
  shopId,
  orderId,
  item,
}: {
  shopId: UUID;
  orderId?: UUID;
  item: Item;
}) => {
  const { mutate } = useAddToCart({
    shopId,
  });

  const shouldOpenOptionSelection = item.mods.length > 1;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldOpenOptionSelection) return;
    else {
      // if we stop the event propagation, the drawer will not open
      e.stopPropagation();
      mutate({
        orderItem: {
          item,
          mods: [],
        },
      });
    }
  };

  return (
    <button
      className="absolute bottom-0 right-0 w-14 h-14 rounded-full flex justify-center items-center"
      onClick={handleClick}
    >
      <div className="bg-white rounded-full flex justify-center items-center w-7 h-7 active:bg-neutral-200 drop-shadow-md">
        <PlusSvg />
      </div>
    </button>
  );
};

export function QuickAddItemCard({
  shopId,
  item,
}: {
  shopId: UUID;
  item: Item;
}) {
  const { data: cart } = useRecentCart();
  const { isFetching } = useShop({ id: shopId });
  const { image, name, price, discountPrice } = item;

  const cartHasSameShop = cart && cart.shop === shopId;

  const orderIsPending = cart && cart.status === '1-pending';
  // if there's no cart, you can always add to cart
  // if the current shop is the same as the cart's shop, you can add to cart
  const canAddToCart =
    !cart || (cartHasSameShop && orderIsPending) || cart.status !== '1-pending';

  return (
    <DrawerTrigger asChild>
      <div className="flex flex-col gap-2">
        <div className="relative overflow-hidden rounded-xl h-36 w-36">
          <Image src={image} alt={name} fill className="object-cover" />
          {cart === undefined ? (
            <Skeleton className="bg-gray-200 rounded-full h-7 w-7 flex justify-center items-center absolute bottom-4 right-2 hover:bg-neutral-200 active:bg-neutral-300 active:scale-95 drop-shadow-md" />
          ) : canAddToCart ? (
            <AddButton
              {...{
                shopId,
                orderId: orderIsPending ? cart?.id : undefined,
                item,
              }}
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{name}</h3>

          <Price
            {...{
              originalPrice: price,
              actualPrice: discountPrice,
              isLoading: isFetching,
            }}
          />
        </div>
      </div>
    </DrawerTrigger>
  );
}

export const ItemOption = ({
  mod,
  setSelectedOptions,
  selectedOptions,
  isFetching,
}: {
  mod: ItemMod;
  setSelectedOptions: Dispatch<
    SetStateAction<
      Record<`${string}-${string}-${string}-${string}-${string}`, ItemMod>
    >
  >;
  selectedOptions: Record<UUID, ItemMod>;
  isFetching: boolean;
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
        {mod.price.wei > 0n ? (
          <Price
            originalPrice={mod.price}
            actualPrice={mod.discountPrice}
            isLoading={isFetching}
          />
        ) : null}
      </div>
    </>
  );
};

export function ModSection({
  mods,
  category,
  setSelectedOptions,
  selectedOptions,
  isFetching,
}: {
  mods: ItemMod[];
  category: CategorySections;
  setSelectedOptions: Dispatch<SetStateAction<Record<UUID, ItemMod>>>;
  selectedOptions: Record<UUID, ItemMod>;
  isFetching: boolean;
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
            {...{
              mod,
              setSelectedOptions,
              selectedOptions,
              isFetching,
            }}
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
  const { data: cart } = useRecentCart();
  const { isFetching } = useShop({ id: shopId });

  const reset = () => {
    setQuantity(1);
    setSelectedOptions({});
  };

  const orderItems: Unsaved<OrderItem[]> = new Array(quantity).fill({
    item,
    mods: Object.values(selectedOptions),
  });

  const modSections = item.mods.reduce((acc, mod) => {
    if (!acc[mod?.category || '__misc__'])
      acc[mod?.category || '__misc__'] = [];
    acc[mod.category || '__misc__'].push(mod);
    return acc;
  }, {} as ModSection);

  return (
    <Drawer onClose={reset}>
      <QuickAddItemCard item={item} shopId={shopId} />

      <DrawerContent>
        <div className="h-[75vh] flex flex-col overflow-scroll">
          <DrawerHeader className="p-0 rounded-t-xl">
            <div className="min-h-64 relative rounded-t-xl overflow-clip">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                quality={30}
              />
            </div>
            <div className="flex flex-col px-6 py-4 gap-y-2">
              <DrawerTitle asChild>
                <Title1 className="text-left">{item.name}</Title1>
              </DrawerTitle>

              <Price
                originalPrice={item.price}
                actualPrice={item.discountPrice}
                isLoading={isFetching}
              />

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
                isFetching={isFetching}
              />
            ))}

          <div className="flex-grow" />
          {cart === null || (cart !== undefined && cart?.shop === shopId) ? (
            <AddToBasketButton
              orderItem={orderItems}
              orderId={cart?.id}
              shopId={shopId}
            />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
