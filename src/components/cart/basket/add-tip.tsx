import { CTAButton } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import {
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
  NestedDrawer,
} from '@/components/ui/drawer';
import { USDCInput } from '@/components/ui/usdc-input';
import { USDC } from '@/data-model/_common/currency/USDC';
import { Order, OrderSummary } from '@/data-model/order/OrderType';
import { cn } from '@/lib/utils';
import { useCartSummary, useTipMutation } from '@/queries/OrderQuery';
import { useShop } from '@/queries/ShopQuery';
import { UUID } from 'crypto';
import { useCallback, useMemo, useState } from 'react';
import { Headline, Label3, Title1 } from '../../ui/typography';

//
//// UTILS
///

const KNOWN_TIP_OPTIONS = [
  {
    __type: 'fixed',
    label: '$1',
    value: USDC.ONE,
  },
  {
    __type: 'fixed',
    label: '$2',
    value: USDC.fromUSD(2),
  },
  {
    __type: 'percentage',
    label: '15%',
    percent: 15,
  },
  {
    __type: 'percentage',
    label: '20%',
    percent: 20,
  },
] as const;

const CUSTOM_OPTION = {
  __type: 'custom',
  label: 'Other',
} as const;

export const TIP_OPTIONS = [...KNOWN_TIP_OPTIONS, CUSTOM_OPTION];

const getTipAmountFromOption = (
  orderSummary: OrderSummary,
  opt: (typeof KNOWN_TIP_OPTIONS)[number],
): USDC => {
  if (opt.__type === 'fixed') return opt.value;
  if (opt.__type === 'percentage')
    return orderSummary.subTotal.usdc.percentageOf({
      percent: opt.percent,
    });

  throw new Error('Invalid tip option');
};

const getOptionFromTipAmount = (orderSummary: OrderSummary) => {
  // if there's no tip or the tip amount is 0, return null
  if (orderSummary.tip === null || orderSummary.tip.usdc.eq(USDC.ZERO))
    return null;

  const [, fixedOption] =
    KNOWN_TIP_OPTIONS.map(
      opt => [getTipAmountFromOption(orderSummary, opt), opt] as const,
    ).find(([amount]) => amount.eq(orderSummary.tip!.usdc)) || [];

  if (!fixedOption) return CUSTOM_OPTION;
  return fixedOption;
};

const useTipButtons = (
  cart: Order,
  cartSummary: OrderSummary | null | undefined,
) => {
  const mutation = useTipMutation();

  const setTip = useCallback(
    async (option: (typeof TIP_OPTIONS)[number] | null) => {
      if (option?.__type === 'custom') return;

      await mutation.mutateAsync({
        order: cart,
        tip:
          option && cartSummary
            ? getTipAmountFromOption(cartSummary, option)
            : null,
      });
    },
    [mutation, cartSummary, cart],
  );

  const selectedTip = useMemo(
    () => (cartSummary ? getOptionFromTipAmount(cartSummary) : null),
    [cartSummary],
  );
  const tipOptions = useMemo(
    () =>
      TIP_OPTIONS.map(option => ({
        ...option,
        isSelected: option.label === selectedTip?.label,
      })),
    [selectedTip?.label],
  );

  return { tipOptions, setTip };
};

//
//// COMPONENTS
///

const TipDrawer = ({
  cart,
  tipOption,
}: {
  cart: Order;
  tipOption: ReturnType<typeof useTipButtons>['tipOptions'][number];
}) => {
  const [tipAmount, setTipAmount] = useState<USDC>(
    (tipOption.isSelected && cart.tip?.amount) || USDC.ZERO,
  );
  const mutation = useTipMutation();

  return (
    <>
      <DrawerTitle className="pt-4 px-6 grow text-center">
        <Title1>Edit tip amount</Title1>
      </DrawerTitle>
      <USDCInput amount={tipAmount} setAmount={setTipAmount} />;
      <Divider />
      <DrawerFooter className="p-6 pt-0">
        <DrawerClose asChild>
          <CTAButton
            onClick={() =>
              mutation
                .mutateAsync({
                  order: cart,
                  tip: tipAmount,
                })
                .then(() => setTipAmount(USDC.ZERO))
            }
          >
            Save
          </CTAButton>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
};

function CustomTipButton({
  cart,
  tipOption,
}: {
  cart: Order;
  tipOption: (typeof TIP_OPTIONS)[number] & { isSelected: boolean };
}) {
  const [open, setOpen] = useState(false);

  return (
    <NestedDrawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          className={cn(
            'flex gap-y-1 min-w-20 items-center justify-center',
            'h-10 rounded-full bg-light-gray',
            'transition-all duration-100',
            'last:mr-6',
            {
              'bg-black text-white': tipOption.isSelected,
            },
          )}
        >
          <Label3>{tipOption.label}</Label3>
        </button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col gap-4 w-full p-0">
        {open && <TipDrawer cart={cart} tipOption={tipOption} />}
      </DrawerContent>
    </NestedDrawer>
  );
}

export const AddTipSection = ({
  cart,
  shopId,
}: {
  cart: Order;
  shopId: UUID;
}) => {
  const { data: shop } = useShop({ id: shopId });

  const cartSummary = useCartSummary();
  const { tipOptions, setTip } = useTipButtons(cart, cartSummary);

  if (!shop) return null;

  return (
    <div className="pl-5 py-6 flex flex-col gap-y-1">
      <Headline className="pl-1">Support your barista</Headline>

      <div className="flex gap-x-4 w-full pl-1 overflow-x-auto py-1.5">
        {tipOptions.map((tipOption, index) => {
          const onClick = tipOption.isSelected
            ? () => setTip(null)
            : () => setTip(tipOption);

          if (tipOption.__type === 'custom')
            return (
              <CustomTipButton key={index} cart={cart} tipOption={tipOption} />
            );
          return (
            <button
              key={index}
              className={cn(
                'flex gap-y-1 min-w-20 items-center justify-center',
                'h-10 rounded-full bg-light-gray',
                'transition-all duration-100',
                'last:mr-6',
                {
                  'bg-black text-white': tipOption.isSelected,
                },
              )}
              onClick={onClick}
            >
              <Label3>{tipOption.label}</Label3>
            </button>
          );
        })}
      </div>
    </div>
  );
};
