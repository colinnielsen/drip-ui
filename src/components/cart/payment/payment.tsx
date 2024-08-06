import coffeeGif from '@/assets/coffee-dive.gif';
import coffeeStill from '@/assets/coffee-still.png';
import { CTAButton, LoadingCTAButton } from '@/components/ui/button';
import { useGoToSlide } from '@/components/ui/carousel';
import { Drip, DripSmall, Label1, Mono } from '@/components/ui/typography';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useSecondsSinceMount } from '@/lib/hooks/utility-hooks';
import { isDev } from '@/lib/utils';
import { useConnectedWallet } from '@/queries/EthereumQuery';
import { useCart, useCartInSliceFormat } from '@/queries/OrderQuery';
import { usePayAndOrder } from '@/queries/SliceQuery';
import Image from 'next/image';
import { useMemo } from 'react';
import { FarmerCard } from '../basket/farmer-card';
import { AsCheckoutSlide } from '../checkout-slides';
import { useCheckoutContext } from '../context';

export const PayButton = () => {
  const wallet = useConnectedWallet();

  const { data: sliceCart, isFetching: sliceCartIsLoading } =
    useCartInSliceFormat({
      buyerAddress: wallet?.address,
    });
  const { isFetching: cartIsLoading } = useCart();
  const { paymentStep } = useCheckoutContext();
  const goToSlide = useGoToSlide();
  const payAndOrder = usePayAndOrder();

  if (!sliceCart || sliceCartIsLoading || cartIsLoading || !wallet)
    return <LoadingCTAButton />;

  return (
    <CTAButton
      onClick={async () => {
        if (!payAndOrder) return;

        goToSlide?.(1);
        await payAndOrder();
      }}
      isLoading={paymentStep === 'awaiting-confirmation'}
    >
      pay
    </CTAButton>
  );
};

export default function PaymentSlide({
  cart,
  shop,
}: {
  cart: Order;
  shop: Shop;
}) {
  const { paymentStep } = useCheckoutContext();

  const seconds = useSecondsSinceMount();

  const dots = Array.from({ length: seconds % 4 }, () => '.');
  const isPaying = paymentStep === 'success';

  const headerText = useMemo(() => {
    if (!isPaying) return 'setting up your order';
    return 'your order is brewing';
  }, [isPaying]);

  const subTitle = useMemo(() => {
    if (!isPaying) return '(we will prompt your wallet soon)';
    return '(via onchain superpowers)';
  }, [isPaying]);

  return (
    <AsCheckoutSlide>
      <div className="h-full bg-background flex flex-col items-center justify-center px-6 gap-4 py-6 w-full">
        {paymentStep === 'error' ? (
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            <DripSmall>oops</DripSmall>
            <Label1 className="text-primary-gray">
              something went wrong, let&apos;s try again
            </Label1>
            <PayButton />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center h-[280px] w-[280px] overflow-clip">
              {isPaying ? (
                <Image src={coffeeGif} alt="loading bar" width={280} />
              ) : (
                <Image src={coffeeStill} alt="loading bar" width={280} />
              )}
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
            order: cart,
            showPics: true,
            className: !isPaying ? 'opacity-0' : 'opacity-1',
          }}
        />

        {isDev() && seconds > 50 && 'transactionHash' in cart && (
          <Mono className="text-[8px] text-center">{cart.transactionHash}</Mono>
        )}
      </div>
    </AsCheckoutSlide>
  );
}
