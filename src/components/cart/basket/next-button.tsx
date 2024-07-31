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
import { useCheckoutContext } from '../context';
import { PayButton } from '../payment/payment';
import WelcomeScreen, { shouldGoToWelcomeSlide } from '../welcome';
import { GetUSDCButton } from '../onboard/onboard';
import { useState } from 'react';

export const NextButton = () => {
  const { step } = useCheckoutContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="px-6 pb-6 w-full min-h-20">
      <Dialog open={isOpen}>
        {step === 'initializing' ? (
          <LoadingCTAButton />
        ) : step === 'get-usdc' ? (
          <GetUSDCButton />
        ) : shouldGoToWelcomeSlide(step) ? (
          <CTAButton onClick={() => setIsOpen(true)}>Next</CTAButton>
        ) : step === 'pay' ? (
          <PayButton />
        ) : (
          'ERR: unexpected state'
        )}
        <DialogContent
          className={cn(CSS_FONT_CLASS_CONFIG, 'max-w-90vw')}
          onClose={() => setIsOpen(false)}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Welcome</DialogTitle>
          </VisuallyHidden.Root>

          <WelcomeScreen onClose={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
