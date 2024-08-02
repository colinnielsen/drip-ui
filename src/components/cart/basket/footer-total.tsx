import { getCostSummary } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { Headline } from '../../ui/typography';
import { Price } from '../../ui/icons';
import { Divider } from '../../ui/divider';

export const FooterTotal = ({ cart }: { cart: Order }) => {
  const summary = getCostSummary(cart);

  return (
    <>
      <Divider />
      <div className="p-4">
        <div className="flex justify-between">
          <Headline>Total</Headline>
          <Price price={summary.total.raw} />
        </div>
      </div>
    </>
  );
};
