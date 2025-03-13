import { ArrowRightIcon } from 'lucide-react';
import { CTAButton } from '../ui/button';
import { useOnrampQuote } from '@/queries/OnrampQuery';
import { usePreferredWalletAddress } from '@/queries/EthereumQuery';

export const WalletActions = () => {
  const preferredWalletAddress = usePreferredWalletAddress() || undefined;

  const { data: quote, isLoading: isQuoteLoading } = useOnrampQuote({
    recipientAddress: preferredWalletAddress,
    enabled: !!preferredWalletAddress,
  });

  return (
    <div className="flex w-full py-4 flex-row-reverse">
      <div className="w-[55%] self-end">
        <CTAButton
          onClick={() => window.open(quote?.url)}
          disabled={!quote}
          isLoading={isQuoteLoading}
        >
          <div className="flex gap-2 items-center">
            <span className="text-center">Top up card</span>{' '}
            <ArrowRightIcon className="inline-block w-5 h-5" />
          </div>
        </CTAButton>
      </div>
    </div>
  );
};
