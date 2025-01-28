import coffeeGif from '@/assets/coffee-dive.gif';
import coffeeStill from '@/assets/coffee-still.png';
import { Button, CTAButton, LoadingCTAButton } from '@/components/ui/button';
import { useGoToSlide, usePreviousSlide } from '@/components/ui/carousel';
import { Drip, DripSmall, Label1 } from '@/components/ui/typography';
import { mapCartToPaymentSummary } from '@/data-model/cart/CartDTO';
import { Cart } from '@/data-model/cart/CartType';
import { Shop, ShopSourceConfig } from '@/data-model/shop/ShopType';
import { useSecondsSinceMount } from '@/lib/hooks/utility-hooks';
import { useCart } from '@/queries/CartQuery';
import { usePayAndOrder as useSlicePayAndOrder } from '@/queries/SliceQuery';
import { usePayAndOrder as useSquarePayAndOrder } from '@/queries/SquareQuery';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { FarmerCard } from '../basket/farmer-card';
import { AsCheckoutSlide } from '../checkout-slides';
import { useCheckoutContext } from '../context';

export const SlicePayButton = () => {
  const { paymentStep } = useCheckoutContext();
  const goToSlide = useGoToSlide();
  const { payAndOrder, ready, buttonText } = useSlicePayAndOrder();

  if (!ready) return <LoadingCTAButton />;
  const isLoading = paymentStep === 'awaiting-confirmation';

  return (
    <>
      <CTAButton
        onClick={async () => {
          goToSlide?.(1);
          await payAndOrder();
        }}
        isLoading={isLoading}
      >
        {isLoading ? '' : buttonText}
      </CTAButton>
    </>
  );
};

export const SquarePayButton = () => {
  const { paymentStep } = useCheckoutContext();
  const { data: cart } = useCart();
  const goToSlide = useGoToSlide();
  const { ready, mutateAsync: payAndOrder } = useSquarePayAndOrder();

  if (!ready) return <LoadingCTAButton />;

  const cartSummary = mapCartToPaymentSummary(cart);
  const isFree = cartSummary?.total?.wei === 0n;
  const isLoading = paymentStep === 'awaiting-confirmation';

  const handleClick = async () => {
    if (!goToSlide) return;
    goToSlide(1);
    await payAndOrder()
      // square-type orders will only create the order if the payment is complete
      // so we can advance to the "order-confirmation" slide
      .then(() => goToSlide(2))
      .catch(() => goToSlide(0));
  };
  return (
    <CTAButton onClick={handleClick} isLoading={isLoading}>
      {!cartSummary ? '' : isFree ? 'place order' : 'pay'}
    </CTAButton>
  );
};

export const PayButton = ({
  shopType,
}: {
  shopType: ShopSourceConfig['type'];
}) => {
  if (shopType === 'slice') return <SlicePayButton />;
  if (shopType === 'square') return <SquarePayButton />;

  let a: never = shopType;
  return a;
};

export default function PaymentSlide({
  cart,
  shop,
}: {
  cart: Cart;
  shop: Shop;
}) {
  const { paymentStep, setPaymentStep } = useCheckoutContext();
  const prevSlide = usePreviousSlide();
  const seconds = useSecondsSinceMount();
  const [hasBeen4SecondsSincePrompted, setHasBeen4SecondsSincePrompted] =
    useState(false);

  const dots = Array.from({ length: seconds % 4 }, () => '.');
  const isPaying = paymentStep === 'paying';

  const headerText = useMemo(() => {
    if (paymentStep === 'awaiting-confirmation') return 'getting ready';
    return 'your order is brewing';
  }, [paymentStep]);

  const subTitle = useMemo(() => {
    if (hasBeen4SecondsSincePrompted)
      return "(we've prompted your wallet for payment)";
    // if (!isPaying) return '(we will prompt your wallet soon)';
    return null;
  }, [hasBeen4SecondsSincePrompted]);

  const icon = useMemo(() => {
    if (isPaying) return coffeeGif;
    return coffeeStill;
  }, [isPaying]);

  const errorNotification = (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      <DripSmall>oops</DripSmall>
      <Label1 className="text-primary-gray">
        something went wrong, let&apos;s try again
      </Label1>

      <div className="flex gap-2 w-full items-center">
        <Button
          variant={'secondary'}
          onClick={() => prevSlide?.()}
          className="aspect-square"
        >
          👈
        </Button>
        <PayButton shopType={shop.__sourceConfig.type} />
      </div>
    </div>
  );

  // useEffect(() => {
  //   let interval: NodeJS.Timeout;

  //   if (paymentStep === 'awaiting-confirmation') {
  //     interval = setTimeout(() => {
  //       setPaymentStep(currentStep => {
  //         if (currentStep === 'awaiting-confirmation') {
  //           setHasBeen4SecondsSincePrompted(true);
  //           return currentStep;
  //         }
  //         return currentStep;
  //       });
  //     }, 4000);
  //   }
  //   return () => interval && clearInterval(interval);
  // }, [paymentStep]);

  return (
    <AsCheckoutSlide>
      <div className="h-full bg-background flex flex-col items-center justify-center px-6 gap-4 py-6 w-full">
        {paymentStep === 'error' ? (
          errorNotification
        ) : (
          <>
            <div className="flex items-center justify-center h-[280px] w-[280px] overflow-clip">
              <Image src={icon} alt="loading bar" width={280} />
            </div>
            <Drip className="text-2xl text-center transition-opacity">
              {headerText}

              {!isPaying && (
                <span className="transition-opacity duration-200">
                  <span
                    className={`opacity-0 ${dots.length > 0 ? 'opacity-100' : ''}`}
                  >
                    .
                  </span>
                  <span
                    className={`opacity-0 ${dots.length > 1 ? 'opacity-100' : ''}`}
                  >
                    .
                  </span>
                  <span
                    className={`opacity-0 ${dots.length > 2 ? 'opacity-100' : ''}`}
                  >
                    .
                  </span>
                </span>
              )}
            </Drip>
            <Label1 className="text-primary-gray text-center text-md">
              {subTitle}
            </Label1>
          </>
        )}
        <div className="h-12" />
        <FarmerCard
          {...{
            shopId: cart.shop,
            showPics: true,
            className: !isPaying ? 'opacity-0' : 'opacity-1',
          }}
        />

        {/* {isDev() && seconds > 50 && 'transactionHash' in cart && (
          <Mono className="text-[8px] text-center">{cart}</Mono>
        )} */}
      </div>
    </AsCheckoutSlide>
  );
}
