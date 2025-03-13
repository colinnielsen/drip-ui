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
        className="bg-black text-white px-4 rounded-[100px] flex items-center gap-[3px] w-full justify-center py-[11px] h-[50px] font-['-apple-system',BlinkMacSystemFont,sans-serif]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlSpace="preserve"
          width="24"
          height="24"
          viewBox="0 0 1000 1000"
          className="h-[18px]"
        >
          <path
            fill="white"
            d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
          />
        </svg>
        <p className="font-semibold text-[23px]">Pay</p>
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
