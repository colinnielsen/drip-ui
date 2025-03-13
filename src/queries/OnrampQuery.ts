import { axiosFetcher } from '@/lib/utils';
import { OnrampQuoteRequest } from '@/pages/api/onramp/onramp-url';
import { useQuery, skipToken } from '@tanstack/react-query';
import { Address } from 'viem';

type CoinbaseQuote = {
  url: string;
  // Add other quote response fields as needed
};

export const useOnrampQuote = ({
  usdAmount,
  recipientAddress,
  enabled = true,
}: {
  usdAmount?: number;
  recipientAddress?: Address;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['onramp-quote', usdAmount],
    queryFn:
      enabled && recipientAddress
        ? () =>
            axiosFetcher<CoinbaseQuote, OnrampQuoteRequest>(
              '/api/onramp/onramp-url',
              {
                method: 'POST',
                data: {
                  amount: usdAmount,
                  recipientAddress,
                },
              },
            )
        : skipToken,
    enabled: enabled && !!recipientAddress,
  });
};
