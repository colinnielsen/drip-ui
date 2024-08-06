import { Order } from '@/data-model/order/OrderType';
import { Headline } from '../../ui/typography';
import { Price } from '../../ui/icons';
import { Divider } from '../../ui/divider';
import { getOrderSummary } from '@/data-model/order/OrderDTO';

export const FooterTotal = ({
  cart,
  isLoading,
}: {
  cart: Order;
  isLoading?: boolean;
}) => {
  const summary = getOrderSummary(cart.orderItems, cart.tip);

  return (
    <>
      <Divider />
      <div className="p-4">
        <div className="flex justify-between">
          <Headline>Total</Headline>
          <Price price={summary?.total.usdc} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
};
