import { cn } from '@/lib/utils';
import { UsdcSVG } from './icons';
import { USDC } from '@/data-model/_common/currency/USDC';
import { forwardRef } from 'react';

const sanitizeInput = (value: string) => value.replace(/[^0-9.]/g, '');

export const USDCInput = forwardRef<
  HTMLInputElement,
  {
    amount: USDC;
    setAmount: (amount: USDC) => void;
  }
>(({ amount, setAmount }, inputRef) => {
  return (
    <div className="flex gap-1 justify-center items-center">
      <UsdcSVG className="h-6 w-6 " />
      <input
        ref={inputRef}
        type="tel"
        value={amount.toUSD() || ''}
        placeholder="0.00"
        className={cn(
          'font-libreFranklin text-3xl w-[70px] text-center caret-transparent',
          !!amount ? 'text-black' : 'text-secondary-gray',
        )}
        onChange={e => {
          const sanitized = sanitizeInput(e.target.value);
          return setAmount(USDC.fromUSD(sanitized));
        }}
      />
    </div>
  );
});
