import { Order } from '@/data-model/order/OrderType';
import { Price } from '../../ui/icons';
import { Body, Headline } from '../../ui/typography';
import { getOrderSummary } from '@/data-model/order/OrderDTO';

export const OrderSummary = ({
  cart,
  isLoading,
}: {
  cart: Order;
  isLoading?: boolean;
}) => {
  const summary = getOrderSummary(cart.orderItems, cart.tip);

  return (
    <div className="p-6 flex flex-col gap-y-4 w-full h-fit transition-all duration-500">
      <div className="flex justify-between items-center">
        <Body>Subtotal</Body>
        <Price price={summary?.subTotal.usdc} isLoading={isLoading} />
      </div>
      {summary && summary.tip && (
        <div className="flex justify-between items-center">
          <Body>Tip</Body>
          <Price price={summary?.tip.usdc} isLoading={isLoading} />
        </div>
      )}
      <div className="flex justify-between items-center">
        <Headline>Total</Headline>
        <Price price={summary?.total.usdc} isLoading={isLoading} />
      </div>
    </div>
  );
};
