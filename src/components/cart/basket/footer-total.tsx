import { USDC } from '@/data-model/_common/currency/USDC';
import { PaymentSummary } from '@/data-model/order/OrderType';
import { Divider } from '../../ui/divider';
import { Price } from '../../ui/icons';
import { Headline } from '../../ui/typography';

export const FooterTotal = ({
  summary,
  isLoading,
}: {
  summary: PaymentSummary;
  isLoading?: boolean;
}) => {
  return (
    <>
      <Divider />
      <div className="p-4">
        <div className="flex justify-between">
          <Headline>Total</Headline>
          <Price
            originalPrice={summary.total || USDC.ZERO}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
};
