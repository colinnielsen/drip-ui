import { ArrowRightIcon } from 'lucide-react';
import { CTAButton, SecondaryButton } from '../ui/button';
import { useOnrampQuote } from '@/queries/OnrampQuery';
import { usePreferredWalletAddress } from '@/queries/EthereumQuery';

export const WalletActions = () => {
  const preferredWalletAddress = usePreferredWalletAddress() || undefined;

  const { data: quote, isLoading: isQuoteLoading } = useOnrampQuote({
    recipientAddress: preferredWalletAddress,
    enabled: !!preferredWalletAddress,
  });

  return (
    <div className="w-full flex py-4 gap-2 justify-center">
      {/* <SecondaryButton
        onClick={() => window.open(quote?.url)}
        disabled={!quote}
        isLoading={isQuoteLoading}
        className="max-w-min"
        variant="secondary-small"
      >
        <div className="flex gap-2 items-center">
          <span className="text-center">cash out $DRIP</span>{' '}
          <ArrowRightIcon className="inline-block w-5 h-5" />
        </div>
      </SecondaryButton> */}

      <CTAButton
        onClick={() => window.open(quote?.url)}
        disabled={!quote}
        isLoading={isQuoteLoading}
        // className="min-w-1/2"
        variant="cta-small"
      >
        <div className="flex gap-2 items-center">
          <span className="text-center">Top up card</span>{' '}
          <ArrowRightIcon className="inline-block w-5 h-5" />
        </div>
      </CTAButton>
    </div>
  );
};
