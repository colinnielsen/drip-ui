import { LoadingCTAButton } from '@/components/ui/button';
import { useCheckoutContext } from '../context';
import { GetUSDCButton } from '../onboard/onboard';
import { PayButton } from '../payment/payment';
import { ConnectButton, shouldGoToWelcomeSlide } from '../welcome';

export const NextButton = () => {
  const { step } = useCheckoutContext();

  return (
    <div className="px-6 pb-6 w-full min-h-20">
      {/* <Dialog open={isOpen}> */}
      {step === 'initializing' ? (
        <LoadingCTAButton />
      ) : step === 'get-usdc' ? (
        <GetUSDCButton />
      ) : shouldGoToWelcomeSlide(step) ? (
        <ConnectButton />
      ) : step === 'pay' ? (
        <PayButton />
      ) : (
        'ERR: unexpected state'
      )}
      {/* <DialogContent
          className={cn(CSS_FONT_CLASS_CONFIG, 'max-w-90vw')}
          onClose={() => setIsOpen(false)}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Welcome</DialogTitle>
          </VisuallyHidden.Root>

          <WelcomeScreen onClose={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog> */}
    </div>
  );
};
