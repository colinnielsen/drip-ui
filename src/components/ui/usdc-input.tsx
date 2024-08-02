import { cn } from '@/lib/utils';
import { UsdcSVG } from './icons';
import { USDC } from '@/data-model/_common/currency/USDC';

export const USDCInput = ({
  amount,
  setAmount,
}: {
  amount: USDC;
  setAmount: (amount: USDC) => void;
}) => {
  return (
    <div className="flex gap-1 justify-center items-center">
      <UsdcSVG className="h-6 w-6 " />
      <input
        type="tel"
        value={amount.toUSD() || undefined}
        placeholder="0.00"
        className={cn(
          'font-libreFranklin text-3xl w-[70px] text-center',
          !!amount ? 'text-black' : 'text-secondary-gray',
        )}
        onChange={e => setAmount(USDC.fromUSD(e.target.value))}
      />
    </div>
  );
};
