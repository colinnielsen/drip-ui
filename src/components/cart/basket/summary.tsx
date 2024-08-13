import { Order } from '@/data-model/order/OrderType';
import { Price } from '../../ui/icons';
import { Body, Headline } from '../../ui/typography';
import { useCartSummary } from '@/queries/OrderQuery';
import { cn } from '@/lib/utils';

export const OrderSummary = ({
  cart,
  isLoading,
}: {
  cart: Order;
  isLoading?: boolean;
}) => {
  const summary = useCartSummary();

  return (
    <div className="p-6 flex flex-col gap-y-4 w-full h-fit transition-all duration-300">
      <div className="flex justify-between items-center">
        <Body>Subtotal</Body>
        <Price originalPrice={summary?.subTotal.usdc} isLoading={isLoading} />
      </div>

      <div
        className={cn('flex justify-between items-center h-5', {
          'text-gray-500 opacity-60': !summary?.tip?.usdc,
        })}
      >
        <Body>Tip</Body>
        {summary?.tip?.usdc ? (
          <Price originalPrice={summary?.tip?.usdc} isLoading={isLoading} />
        ) : (
          <Body className="opacity-60">--</Body>
        )}
      </div>

      <div className="flex justify-between items-center">
        <Headline>Total</Headline>
        <Price originalPrice={summary?.total.usdc} isLoading={isLoading} />
      </div>
    </div>
  );
};
