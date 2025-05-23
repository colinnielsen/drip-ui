import { LoadingCTAButton } from '@/components/ui/button';
import { ShopSourceConfig } from '@/data-model/shop/ShopType';
import { useCheckoutContext } from '../context';
import { GetUSDCButton } from '../onramp/onramp';
import { PayButton } from '../payment/payment';
import { ConnectButton, shouldGoToWelcomeSlide } from '../welcome';

export const NextButton = ({
  shopType,
}: {
  shopType: ShopSourceConfig['type'];
}) => {
  const { step, error } = useCheckoutContext();
  return (
    <div className="px-6 pb-6 w-full min-h-20">
      {step === 'initializing' ? (
        <LoadingCTAButton />
      ) : step === 'get-usdc' ? (
        <GetUSDCButton />
      ) : shouldGoToWelcomeSlide(step) ? (
        <ConnectButton />
      ) : step === 'pay' ? (
        <PayButton {...{ shopType }} />
      ) : (
        <div className="text-red-500">{error || 'error'}</div>
      )}
    </div>
  );
};
