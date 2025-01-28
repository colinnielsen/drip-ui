import { CTAButton } from '@/components/ui/button';
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { subCurrencies } from '@/data-model/_common/currency/currencyDTO';
import { UUID } from '@/data-model/_common/type/CommonType';
import { deriveDefaultImageFromItemName } from '@/data-model/_external/data-sources/common';
import { ItemCategory } from '@/data-model/item/common';
import { ItemMod } from '@/data-model/item/ItemMod';
import { Item, ItemVariant } from '@/data-model/item/ItemType';
import { cn } from '@/lib/utils';
import { useAddToCart, useCart } from '@/queries/CartQuery';
import {
  useItemDiscountQuotes,
  useItemPriceWithDiscounts,
} from '@/queries/ItemQuery';
import { useShop } from '@/queries/ShopQuery';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PlusSvg, Price, PriceRange } from '../ui/icons';
import { Label } from '../ui/label';
import { NumberInput } from '../ui/number-input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Skeleton } from '../ui/skeleton';
import { Body, Headline, Title1 } from '../ui/typography';
import { useItemDetails } from './item-details-context';

type CategorySections = ItemCategory | '__misc__';
type ModSection = { [key in CategorySections]: ItemMod[] };

function AddToBasketButton({
  shopId,
  item,
  variant,
  quantity,
  mods,
}: {
  shopId: UUID;
  item: Item;
  variant: ItemVariant;
  quantity: number;
  mods: ItemMod[];
}) {
  const { setOpen } = useItemDetails();
  const { mutate } = useAddToCart({
    shopId,
    item,
  });

  const { isFetching: isFetchingDiscounts, data: discountQuotes } =
    useItemDiscountQuotes({
      shopId,
      itemId: item.id,
    });

  const discounts = discountQuotes?.map(dq => dq.discount) ?? [];

  return (
    <DrawerFooter className="bottom-0 sticky bg-white shadow-drawer-secondary">
      <DrawerClose asChild onClick={() => setOpen(false)}>
        <CTAButton
          disabled={isFetchingDiscounts || !discountQuotes}
          onClick={e =>
            mutate({
              item,
              variant,
              quantity,
              mods,
              discounts,
            })
          }
        >
          Add to Cart
        </CTAButton>
      </DrawerClose>
    </DrawerFooter>
  );
}

export const QuickAddPlusButton = ({
  shopId,
  item,
}: {
  shopId: UUID;
  item: Item;
}) => {
  const { isFetching: isFetchingDiscounts, data: discountQuotes } =
    useItemDiscountQuotes({
      shopId,
      itemId: item.id,
    });

  const { mutate } = useAddToCart({
    shopId,
    item,
  });

  const shouldOpenOptionSelection = item.variants.length > 1;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // if we do not stop the event propagation, the drawer will not open
    if (shouldOpenOptionSelection || !discountQuotes) return;
    else {
      e.stopPropagation();
      mutate({
        item,
        variant: item.variants[0],
        quantity: 1,
        mods: [],
        discounts: discountQuotes.map(dq => dq.discount),
      });
    }
  };

  return (
    <button
      disabled={isFetchingDiscounts}
      className="absolute bottom-0 right-0 w-14 h-14 rounded-full flex justify-center items-center"
      onClick={handleClick}
    >
      <div className="bg-white rounded-full flex justify-center items-center w-7 h-7 active:bg-neutral-200 drop-shadow-md disabled:bg-neutral-200">
        <PlusSvg />
      </div>
    </button>
  );
};

// export const ItemOption = ({
//   mod,
//   setSelectedOptions,
//   selectedOptions,
//   isFetching,
// }: {
//   mod: ItemMod;
//   setSelectedOptions: Dispatch<
//     SetStateAction<
//       Record<`${string}-${string}-${string}-${string}-${string}`, ItemMod>
//     >
//   >;
//   selectedOptions: Record<UUID, ItemMod>;
//   isFetching: boolean;
// }) => {
//   const checked = !!selectedOptions[mod.id];
//   // const [quantity, setQuantity] = useState(0);
//   function selectBooleanMod(checked: boolean) {
//     setSelectedOptions(prev => {
//       if (!checked) {
//         const { [mod.id]: _, ...next } = prev;
//         return next;
//       }

//       if (mod.type === 'exclusive') {
//         const previousWithoutSameCategory = Object.values(prev)
//           .filter(m => m.category !== mod.category)
//           .reduce<Record<UUID, ItemMod>>((acc, m) => {
//             acc[m.id] = m;
//             return acc;
//           }, {});

//         return {
//           ...previousWithoutSameCategory,
//           [mod.id]: {
//             ...mod,
//             value: !!checked,
//           },
//         };
//       } else
//         return {
//           ...prev,
//           [mod.id]: {
//             ...mod,
//             value: !!checked,
//           },
//         };
//     });
//   }

//   // function selectNumericOption(value: number) {
//   //   setQuantity(value);
//   //   setSelectedOptions(prev => {
//   //     if (value === 0) {
//   //       const { [option.id]: _, ...next } = prev;
//   //       return next;
//   //     }
//   //     return {
//   //       ...prev,
//   //       [option.id]: {
//   //         ...option,
//   //         value,
//   //       },
//   //     };
//   //   });
//   // }

//   // if (option.type === 'boolean') option.value;
//   // else option.value;

//   return (
//     <>
//       <div className="flex justify-between items-center py-4 border-b border-b-gray-50">
//         <div className="flex gap-2 items-center w-full">
//           <Checkbox
//             id={mod.name}
//             checked={checked}
//             className="w-5 h-5"
//             onCheckedChange={selectBooleanMod}
//           />
//           <div className="w-full flex gap-x-2 items-center">
//             <label htmlFor={mod.name}>{mod.name}</label>
//             {/* {option.type === 'number' && (
//               <NumberInput
//                 id={option.name}
//                 value={quantity}
//                 onPlus={() => quantity < 4 && selectNumericOption(quantity + 1)}
//                 onMinus={() => quantity && selectNumericOption(quantity - 1)}
//               />
//             )} */}
//           </div>
//         </div>
//         {mod.price.wei > 0n ? (
//           <Price
//             originalPrice={mod.price}
//             actualPrice={mod.discountPrice}
//             isLoading={isFetching}
//           />
//         ) : null}
//       </div>
//     </>
//   );
// };

// export function ModSection({
//   mods,
//   category,
//   setSelectedOptions,
//   selectedOptions,
//   isFetching,
// }: {
//   mods: ItemMod[];
//   category: CategorySections;
//   setSelectedOptions: Dispatch<SetStateAction<Record<UUID, ItemMod>>>;
//   selectedOptions: Record<UUID, ItemMod>;
//   isFetching: boolean;
// }) {
//   const label = category === '__misc__' ? 'Options' : category;

//   return (
//     <>
//       <Divider />
//       <div className="px-4 py-6">
//         <Headline>{label}</Headline>
//         {mods?.map((mod, i) => (
//           <ItemOption
//             key={i}
//             {...{
//               mod,
//               setSelectedOptions,
//               selectedOptions,
//               isFetching,
//             }}
//           />
//         ))}
//       </div>
//     </>
//   );
// }

const LogMount = () => {
  useEffect(() => {
    console.log('mounted');
    return () => {
      console.log('unmounted');
    };
  }, []);
  return null;
};

export function ItemDetailsDrawer() {
  const { selectedItem, shopId } = useItemDetails();
  const [variantZero] = selectedItem?.variants ?? [];

  const [quantity, setQuantity] = useState(1);

  const { data: shop } = useShop({ id: shopId });
  const { data: priceQuote, isFetching: isFetchingPriceQuote } =
    useItemPriceWithDiscounts({
      shopId,
      item: selectedItem || undefined,
    });

  const [variant, setVariant] = useState(variantZero) ?? variantZero;
  const [selectedMods, setSelectedMods] = useState<ItemMod[]>([]);

  const isSingleVariant = selectedItem?.variants.length === 1;

  const modCategories = selectedItem?.mods?.reduce((acc, mod) => {
    if (!acc[mod?.category || '__misc__'])
      acc[mod?.category || '__misc__'] = [];
    acc[mod.category || '__misc__'].push(mod);
    return acc;
  }, {} as ModSection);

  const lowestPrice =
    priceQuote?.discountedPrice ?? selectedItem?.variants.at(0)!.price;
  const highestPrice =
    priceQuote?.discountedPrice ?? selectedItem?.variants.at(-1)!.price;

  useEffect(() => {
    setVariant(selectedItem?.variants[0] || undefined);
    setQuantity(1);
  }, [selectedItem]);

  return (
    <DrawerContent>
      <DrawerDescription className="hidden">
        {selectedItem?.name}
      </DrawerDescription>
      <div className="h-[90vh] flex flex-col overflow-scroll gap-o divide-y divide-light-gray">
        <DrawerHeader className="p-0 rounded-t-xl gap-0">
          <div className="min-h-64 relative rounded-t-xl overflow-clip">
            <Image
              src={selectedItem?.image ?? deriveDefaultImageFromItemName(null)}
              alt={selectedItem?.name ?? 'loading...'}
              fill
              className="object-cover"
              quality={30}
              sizes="100vw"
            />
          </div>

          <div className="flex flex-col px-6 py-4 gap-y-2">
            <DrawerTitle asChild>
              <Title1
                className={cn(
                  '!text-[32px] !font-garamond !leading-[36.9px] !align-middle !font-normal !text-left',
                )}
              >
                {selectedItem?.name}{' '}
                {isSingleVariant ? `- ${variant?.name}` : null}
              </Title1>
            </DrawerTitle>

            {isSingleVariant ? (
              <Price
                originalPrice={selectedItem.variants.at(0)!.price}
                actualPrice={priceQuote?.discountedPrice}
                isLoading={isFetchingPriceQuote}
              />
            ) : (
              <PriceRange minPrice={lowestPrice} maxPrice={highestPrice} />
            )}

            <NumberInput
              onPlus={() => setQuantity(quantity + 1)}
              onMinus={() => quantity > 1 && setQuantity(quantity - 1)}
              value={quantity}
            />
          </div>
        </DrawerHeader>

        {selectedItem?.description && (
          <div className="flex flex-col px-4 py-6 gap-y-2.5">
            <Headline>Description</Headline>
            <Body className="text-left">{selectedItem.description}</Body>
          </div>
        )}

        <div className="flex px-6 py-6 flex-col gap-y-2.5">
          <Headline>Pick up</Headline>
          {shop?.__type === 'storefront' && (
            <RadioGroup defaultValue="pickup">
              <div className="flex space-x-2 items-start">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup">
                  <Body className="text-primary-gray font-normal">
                    {shop?.label} <br />
                    {shop.location?.address.split(' ').slice(0, -1).join(' ')}
                  </Body>
                </Label>
              </div>
            </RadioGroup>
          )}
        </div>

        {selectedItem && !isSingleVariant && variant && (
          <div className="flex px-6 py-6 flex-col">
            <Headline>Variations</Headline>
            <LogMount />
            <RadioGroup
              defaultValue={variant.id}
              onValueChange={variantId =>
                setVariant(selectedItem.variants.find(v => v.id === variantId)!)
              }
              className="divide-y divide-light-gray gap-0"
            >
              {selectedItem?.variants.map((variant, i) => {
                const priceDiff = subCurrencies(
                  variant.price,
                  selectedItem.variants[0].price,
                );
                return (
                  <div className="flex space-x-2 items-center py-4" key={i}>
                    <RadioGroupItem value={variant.id} id={variant.id} />
                    <Label
                      htmlFor={variant.id}
                      className="w-full items-center justify-between flex"
                    >
                      <Body className="font-normal">{variant.name}</Body>
                      {priceDiff.wei > 0n && (
                        <Price
                          originalPrice={priceDiff}
                          isLoading={false}
                          isAdditive
                        />
                      )}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {modCategories && (
          <div className="flex px-6 py-6 flex-col">
            <Headline>Mods</Headline>
            {Object.entries(modCategories).map(([category, mods]) => (
              <></>
            ))}
          </div>
        )}

        <div className="flex-grow" />

        {selectedItem && variant && (
          <AddToBasketButton
            item={selectedItem}
            shopId={shopId}
            variant={variant}
            quantity={quantity}
            mods={selectedMods}
          />
        )}
      </div>
    </DrawerContent>
  );
}

export function ItemCard({ shopId, item }: { shopId: UUID; item: Item }) {
  const { setSelectedItem, setOpen } = useItemDetails();
  const { data: cart } = useCart();
  const { data: priceQuote, isFetching: isFetchingPriceQuote } =
    useItemPriceWithDiscounts({
      shopId,
      item,
    });

  const { image, name } = item;
  const cartIsLoading = cart === undefined;
  const canAddToCart =
    // if there's no cart, you can always add to cart
    !cart ||
    // or if there is a cart and the current shop is the same as the cart's shop, you can add to cart
    cart.shop === shopId;

  const handleOpen = () => {
    setSelectedItem(item);
    setOpen(true);
  };

  return (
    <DrawerTrigger asChild onClick={handleOpen}>
      <div className="flex flex-col gap-2">
        <div className="relative overflow-hidden rounded-xl h-36 w-36">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            quality={50}
            sizes="30vw"
          />
          {cartIsLoading ? (
            <Skeleton className="bg-gray-200 rounded-full h-7 w-7 flex justify-center items-center absolute bottom-4 right-2 hover:bg-neutral-200 active:bg-neutral-300 active:scale-95 drop-shadow-md" />
          ) : canAddToCart ? (
            <QuickAddPlusButton
              {...{
                shopId,
                item,
              }}
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{name}</h3>
          <Price
            {...{
              originalPrice: item.variants[0].price,
              actualPrice: priceQuote?.discountedPrice,
              isLoading: isFetchingPriceQuote,
            }}
          />
        </div>
      </div>
    </DrawerTrigger>
  );
}
