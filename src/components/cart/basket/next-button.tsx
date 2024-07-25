import { CTAButton, LoadingCTAButton } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CSS_FONT_CLASS_CONFIG } from '@/pages/_app';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useCheckoutContext } from '../checkout-context';
import { PayButton } from '../payment/payment';
import { WelcomeScreen, shouldGoToWelcomeSlide } from '../welcome';
import { GetUSDCButton } from '../onboard/onboard';

// export const NextButton = dynamic(() => import('../checkout'), {
//   ssr: false,
//   loading: () => (
//     <Skeleton className="h-14 w-full rounded-[50px] bg-secondary-pop" />
//   ),
// });

export const NextButton = () => {
  const { step } = useCheckoutContext();

  return (
    <div className="px-6 pb-6 w-full min-h-20">
      {step === 'initializing' ? (
        <LoadingCTAButton />
      ) : step === 'get-usdc' ? (
        <GetUSDCButton />
      ) : shouldGoToWelcomeSlide(step) ? (
        <Dialog>
          <DialogTrigger asChild>
            <CTAButton>Next</CTAButton>
          </DialogTrigger>
          <DialogContent className={cn(CSS_FONT_CLASS_CONFIG, 'max-w-90vw')}>
            <VisuallyHidden.Root>
              <DialogTitle>Welcome </DialogTitle>
            </VisuallyHidden.Root>
            <WelcomeScreen />
          </DialogContent>
        </Dialog>
      ) : step === 'pay' ? (
        <PayButton />
      ) : (
        'ERR: unexpected state'
      )}
    </div>
  );
};
