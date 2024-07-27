import { cn } from '@/lib/utils';
import { UsdcSVG } from './icons';

export const USDCInput = ({
  amount,
  setAmount,
}: {
  amount: number;
  setAmount: (amount: number) => void;
}) => {
  return (
    <div className="flex gap-1 justify-center items-center">
      <UsdcSVG className="h-6 w-6 " />
      <input
        type="tel"
        value={amount || undefined}
        placeholder="0.00"
        className={cn(
          'font-libreFranklin text-3xl w-[70px] text-center',
          !!amount ? 'text-black' : 'text-secondary-gray',
        )}
        onChange={e => setAmount(Number(e.target.value))}
      />
    </div>
  );
};
