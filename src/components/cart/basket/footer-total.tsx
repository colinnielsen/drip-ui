import { Order } from '@/data-model/order/OrderType';
import { Headline } from '../../ui/typography';
import { Price } from '../../ui/icons';
import { Divider } from '../../ui/divider';
import { useCartSummary } from '@/queries/OrderQuery';

export const FooterTotal = ({
  cart,
  isLoading,
}: {
  cart: Order;
  isLoading?: boolean;
}) => {
  const cartSummary = useCartSummary();

  return (
    <>
      <Divider />
      <div className="p-4">
        <div className="flex justify-between">
          <Headline>Total</Headline>
          <Price
            price={cartSummary?.total.usdc}
            isLoading={isLoading || !cartSummary}
          />
        </div>
      </div>
    </>
  );
};
