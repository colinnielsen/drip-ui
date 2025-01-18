import { LoadingCTAButton } from '@/components/ui/button';
import { ShopSourceConfig } from '@/data-model/shop/ShopType';
import { useCheckoutContext } from '../context';
import { GetUSDCButton } from '../onboard/onboard';
import { PayButton } from '../payment/payment';
import { ConnectButton, shouldGoToWelcomeSlide } from '../welcome';

export const NextButton = ({
  shopType,
}: {
  shopType: ShopSourceConfig['type'];
}) => {
  const { step } = useCheckoutContext();

  return (
    <div className="px-6 pb-6 w-full min-h-20">
      {step === 'initializing' ? (
        <LoadingCTAButton />
      ) : step === 'get-usdc' ? (
        <GetUSDCButton />
      ) : shouldGoToWelcomeSlide(step) ? (
        <ConnectButton />
      ) : step === 'pay' ? (
        // null
        <PayButton {...{ shopType }} />
      ) : (
        ''
      )}
    </div>
  );
};
