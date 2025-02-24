import { CTAButton, LoadingCTAButton } from '@/components/ui/button';
import { MIN_USDC_ONRAMP_AMOUNT } from '@/lib/onramping/onramping';
import { axiosFetcher } from '@/lib/utils';
import { OnrampQuoteRequest } from '@/pages/api/onramp/onramp-url';
import { useCart } from '@/queries/CartQuery';
import {
  usePreferredWallet,
  usePreferredWalletAddress,
} from '@/queries/EthereumQuery';
import { skipToken, useQuery } from '@tanstack/react-query';

type CoinbaseQuote = {
  url: string;
  // Add other quote response fields as needed
};

export const GetUSDCButton = () => {
  const { data: cart, isLoading: isCartLoading } = useCart();
  const preferredWalletAddress = usePreferredWalletAddress();

  const total = cart?.quotedTotalAmount?.toUSDC().toUSD() || 0;
  const usdAmount = Math.max(total, MIN_USDC_ONRAMP_AMOUNT);

  const { data: quote, isLoading: isQuoteLoading } = useQuery({
    queryKey: ['onramp-quote', usdAmount],
    queryFn: preferredWalletAddress
      ? () =>
          axiosFetcher<CoinbaseQuote, OnrampQuoteRequest>(
            '/api/onramp/onramp-url',
            {
              method: 'POST',
              data: {
                amount: usdAmount,
                recipientAddress: preferredWalletAddress,
              },
            },
          )
      : skipToken,
    enabled: !isCartLoading && !!preferredWalletAddress,
  });
  console.log('quote', quote);

  if (isQuoteLoading || !quote) return <LoadingCTAButton />;
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <CTAButton onClick={() => window.open(quote.url)}>
        Buy with Apple Pay
      </CTAButton>
    </div>
  );

  // return (
  //   <Drawer>
  //     <DrawerTrigger asChild>
  //       <CTAButton>Get some USDC</CTAButton>
  //     </DrawerTrigger>
  //     <DrawerContent className="flex flex-col h-[90vh]">
  //       <div className="flex justify-start w-full items-center px-6 py-4">
  //         <DrawerClose asChild>
  //           <button>
  //             <X height={24} width={24} />
  //           </button>
  //         </DrawerClose>
  //       </div>
  //       <DrawerTitle className="px-6 text-center">
  //         <Title1>Get USDC</Title1>
  //       </DrawerTitle>
  //       <div className="flex-1">
  //         <CoinbaseOnboarding amount={usdAmount} />
  //       </div>
  //     </DrawerContent>
  //   </Drawer>
  // );
};
