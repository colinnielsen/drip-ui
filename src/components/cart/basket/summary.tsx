import { USDC } from '@/data-model/_common/currency/USDC';
import { mapCartToPaymentSummary } from '@/data-model/cart/CartDTO';
import {
  EMPTY_SUMMARY,
  mapOrderToPaymentSummary,
} from '@/data-model/order/OrderDTO';
import { Order, PaymentSummary } from '@/data-model/order/OrderType';
import { cn } from '@/lib/utils';
import { useCart } from '@/queries/CartQuery';
import { Price } from '../../ui/icons';
import { Body, Headline } from '../../ui/typography';

export const CostSummary = ({
  summary: summary = EMPTY_SUMMARY,
  hideTipIfZero: hideTipIfZero = false,
  isLoading,
}: {
  summary?: PaymentSummary;
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

  const summary = mapCartToPaymentSummary(cart);
  return <CostSummary summary={summary} isLoading={isLoading} hideTipIfZero />;
};

export const PurchaseSummary = ({
  order,
  isLoading,
}: {
  order?: Order;
  isLoading?: boolean;
}) => {
  const summary = order ? mapOrderToPaymentSummary(order) : undefined;

  return <CostSummary summary={summary} isLoading={isLoading} hideTipIfZero />;
};
