import { getCostSummary } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { Price } from '../../ui/icons';
import { Body, Headline } from '../../ui/typography';

export const OrderSummary = ({ cart }: { cart: Order }) => {
  const summary = getCostSummary(cart);

  return (
    <div className="p-6 flex flex-col gap-y-4 w-full h-fit transition-all duration-500">
      <div className="flex justify-between items-center">
        <Body>Subtotal</Body>
        <Price
          {...{
            currency: 'usdc',
            currencyDecimals: 6,
            price: summary.subTotal.usdc,
          }}
        />
      </div>
      {summary.tip && (
        <div className="flex justify-between items-center">
          <Body>Tip</Body>
          <Price
            {...{
              currency: 'usdc',
              currencyDecimals: 6,
              price: summary.tip.usdc,
            }}
          />
        </div>
      )}
      <div className="flex justify-between items-center">
        <Headline>Total</Headline>
        <Price
          {...{
            currency: 'usdc',
            currencyDecimals: 6,
            price: summary.total.raw,
          }}
        />
      </div>
    </div>
  );
};
