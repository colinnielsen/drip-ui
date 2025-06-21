import { LoadingCTAButton } from '@/components/ui/button';
import { MIN_USDC_ONRAMP_AMOUNT } from '@/lib/onramping/onramping';
import { useCart } from '@/queries/CartQuery';
import { usePreferredWalletAddress } from '@/queries/EthereumQuery';
import { useOnrampQuote } from '@/queries/OnrampQuery';

export const GetUSDCButton = () => {
  const { data: cart, isLoading: isCartLoading } = useCart();
  const preferredWalletAddress = usePreferredWalletAddress();

  const total = cart?.quotedTotalAmount?.toUSDC().toUSD() || 0;
  const usdAmount = Math.max(total, MIN_USDC_ONRAMP_AMOUNT);

  const { data: quote, isLoading: isQuoteLoading } = useOnrampQuote({
    usdAmount: usdAmount,
    recipientAddress: preferredWalletAddress || undefined,
    enabled: !isCartLoading && !!preferredWalletAddress && !!usdAmount,
  });

  if (isQuoteLoading || !quote) return <LoadingCTAButton />;
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <button
        onClick={() => window.open(quote.url)}
        className="bg-[#0052FF] text-white px-4 rounded-[100px] flex items-center gap-2 w-full justify-center py-[11px] h-[50px] font-semibold text-lg hover:bg-[#0048e5] transition-colors"
      >
        <svg
          viewBox="0 0 146 146"
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
        >
          <circle cx="73" cy="73" r="73" fill="#0052FF" />
          <path
            d="M73.323 123.729C101.617 123.729 124.553 100.832 124.553 72.5875C124.553 44.343 101.617 21.4463 73.323 21.4463C46.4795 21.4463 24.4581 42.0558 22.271 68.2887H89.9859V76.8864H22.271C24.4581 103.119 46.4795 123.729 73.323 123.729Z"
            fill="white"
          />
        </svg>
        <span>Top up with Coinbase</span>
      </button>
      {/* <CTAButton>Buy with Apple Pay</CTAButton> */}
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
