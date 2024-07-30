import { Order } from '@/data-model/order/OrderType';
import { useShop } from '@/queries/ShopQuery';
import { Headline, Label3 } from '../../ui/typography';
import { cn } from '@/lib/utils';
import { UUID } from 'crypto';

export const TIP_OPTIONS = [
  {
    __type: 'fixed',
    label: '$1',
    value: 1,
  },
  {
    __type: 'fixed',
    label: '$2',
    value: 2,
  },
  {
    __type: 'percentage',
    label: '15%',
    value: 0.15,
  },
  {
    __type: 'percentage',
    label: '20%',
    value: 0.2,
  },
  {
    __type: 'custom',
    label: 'Other',
  },
];

export const AddTipSection = ({
  cart,
  shopId,
}: {
  cart: Order;
  shopId: UUID;
}) => {
  const { data: shop } = useShop(shopId);

  if (!shop) return null;

  const selectedOptionIdx = 1;

  function TipButton({
    index,
    tipOption,
  }: {
    index: number;
    tipOption: (typeof TIP_OPTIONS)[number];
  }) {
    return (
      <button
        key={index}
        className={cn(
          'flex gap-y-1 min-w-20 items-center justify-center',
          'h-10 rounded-full bg-light-gray',
          'transition-all duration-100',
          'last:mr-6',
          {
            'bg-black text-white': index === selectedOptionIdx,
          },
        )}
      >
        <Label3>{tipOption.label}</Label3>
      </button>
    );
  }

  return (
    <div className="pl-5 py-6 flex flex-col gap-y-1">
      <Headline className="pl-1">Support your barista</Headline>

      <div className="flex gap-x-4 w-full pl-1 overflow-x-auto py-1.5">
        {TIP_OPTIONS.map((tipOption, index) => (
          <TipButton key={index} index={index} tipOption={tipOption} />
        ))}
      </div>
    </div>
  );
};
