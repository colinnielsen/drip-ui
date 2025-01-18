import { USDC } from '@/data-model/_common/currency/USDC';
import { Cart } from '@/data-model/cart/CartType';
import { cn } from '@/lib/utils';
import { useCart } from '@/queries/CartQuery';
import { Price } from '../../ui/icons';
import { Body, Headline } from '../../ui/typography';
import { Order, PaymentSummary } from '@/data-model/order/OrderType';
import { mapOrderOrCartToPaymentSummary } from '@/data-model/order/OrderDTO';

export const OrderSummary = ({
  summary,
  hideTipIfZero: hideTipIfZero = false,
  isLoading,
}: {
  summary: PaymentSummary;
  hideTipIfZero?: boolean;
  isLoading?: boolean;
}) => {
  return (
    <div className="p-6 flex flex-col gap-y-4 w-full h-fit transition-all duration-300">
      <div className="flex justify-between items-center">
        <Body>Subtotal</Body>
        <Price
          originalPrice={summary.subtotal || USDC.ZERO}
          isLoading={isLoading}
        />
      </div>

      {(summary.tip || !hideTipIfZero) && (
        <div
          className={cn('flex justify-between items-center h-5', {
            'text-gray-500 opacity-60': !summary.tip,
          })}
        >
          <Body>Tip</Body>
          {summary.tip ? (
            <Price originalPrice={summary.tip} isLoading={isLoading} />
          ) : (
            <Body className="opacity-60">--</Body>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Headline>Total</Headline>
        <Price
          originalPrice={summary.total || USDC.ZERO}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export const CartSummary = ({
  isLoading,
  hideTipIfZero = false,
}: {
  isLoading?: boolean;
  hideTipIfZero?: boolean;
}) => {
  const { data: cart } = useCart();

  if (!cart) return null;

  const summary = mapOrderOrCartToPaymentSummary(cart);
  return <OrderSummary summary={summary} isLoading={isLoading} hideTipIfZero />;
};
