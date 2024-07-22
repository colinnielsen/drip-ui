import { CTAButton } from '@/components/ui/button';
import { useCarousel } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { useCheckoutContext } from '../checkout-context';

const LoadingButton = () => (
  <Skeleton className="h-14 w-full rounded-[50px] bg-secondary-pop" />
);

// export const NextButton = dynamic(() => import('../checkout'), {
//   ssr: false,
//   loading: () => (
//     <Skeleton className="h-14 w-full rounded-[50px] bg-secondary-pop" />
//   ),
// });

export const NextButton = () => {
  const { step } = useCheckoutContext();
  const { scrollNext } = useCarousel();

  return (
    <div className="px-6 pb-6 w-full min-h-20">
      {step === 'initializing' ? (
        <LoadingButton />
      ) : (
        <CTAButton onClick={() => scrollNext()}>
          {step === 'pay' ? 'Checkout' : 'Next'}
        </CTAButton>
      )}
    </div>
  );
};
