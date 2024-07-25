import coffeeGif from '@/assets/coffee-dive.gif';
import coffeeStill from '@/assets/coffee-still.png';
import { CTAButton, LoadingCTAButton } from '@/components/ui/button';
import { useGoToSlide, useSlideInView } from '@/components/ui/carousel';
import { Drip, DripSmall, Label1, Mono } from '@/components/ui/typography';
import { isPaidOrder } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useSecondsSinceMount } from '@/lib/hooks/utility-hooks';
import { isDev } from '@/lib/utils';
import { useConnectedWallet } from '@/queries/EthereumQuery';
import {
  useCart,
  useCartInSliceFormat,
  useCheckOrderStatus,
} from '@/queries/OrderQuery';
import { usePayAndOrder } from '@/queries/SliceQuery';
import { SliceProvider } from '@slicekit/react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { FarmerCard } from '../basket/farmer-card';
import { useCheckoutContext } from '../checkout-context';
import { AsCheckoutSlide } from '../checkout-slides';

/**
 * NOTE:
 * getExternalAllowances
 * 1.signAuthorization
 * 2. payWithAuthorization
 */

/**
 * calc discounts
 * 1. usePriceRecap?
 * 2. getTotalPrices?
 */

const UnderlyingPaymentButton = () =>
  //   {
  //   buyer,
  //   sliceCart,
  // }: {
  //   buyer: Address;
  //   sliceCart: ProductCart[];
  // }
  {
    const { paymentStep } = useCheckoutContext();
    const goToSlide = useGoToSlide();
    const payAndOrder = usePayAndOrder();

    const purchase = async () => {
      if (!payAndOrder) return;

      goToSlide?.(1);
      await payAndOrder();
    };

    return (
      <CTAButton
        onClick={purchase}
        isLoading={paymentStep === 'awaiting-confirmation'}
      >
        pay
      </CTAButton>
    );
  };

export const PayButton = () => {
  const wallet = useConnectedWallet();

  const { data: sliceCart, isFetching: sliceCartIsLoading } =
    useCartInSliceFormat({
      buyerAddress: wallet?.address,
    });
  const { isFetching: cartIsLoading } = useCart();
  if (!sliceCart || sliceCartIsLoading || cartIsLoading || !wallet)
    return <LoadingCTAButton />;

  return (
    <SliceProvider initCart={sliceCart}>
      <UnderlyingPaymentButton />
    </SliceProvider>
  );
};

const StatusListener = ({ order }: { order: Order }) => {
  const slideInView = useSlideInView();
  const goToSlide = useGoToSlide();
  const { mutateAsync: checkStatus } = useCheckOrderStatus();
  const [complete, setComplete] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const seconds = useSecondsSinceMount();
  const isInView = slideInView === 1;

  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus(order.id).then(newOrder => {
        if (isPaidOrder(newOrder)) {
          setComplete(true);
          clearInterval(interval);
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (seconds > 4 && complete && !hasScrolled && isInView) {
      goToSlide?.(2);
      setHasScrolled(true);
    }
  }, [seconds, complete, hasScrolled, isInView]);

  return null;
};

const PaymentSlide = ({ cart, shop }: { cart: Order; shop: Shop }) => {
  const { paymentStep } = useCheckoutContext();
  // const data = useFarmerAllocationFromOrder(cart);

  // lol
  const MAX_DOTS = 4;
  const seconds = useSecondsSinceMount();

  const dots = Array.from({ length: seconds % MAX_DOTS }, () => '.');
  const isPaying = paymentStep === 'success';

  const headerText = useMemo(() => {
    if (!isPaying) return 'setting up your order';
    return 'your order is brewing';
  }, [isPaying]);

  const subTitle = useMemo(() => {
    if (!isPaying) return '(we will prompt your web3 wallet soon)';
    return '(via onchain superpowers)';
  }, [isPaying]);

  return (
    <div className="h-full bg-background flex flex-col items-center justify-center px-6 gap-4 py-6 w-full">
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
      <div className="h-12" />
      <FarmerCard
        {...{
          order: cart,
          showPics: true,
          className: !isPaying || seconds <= 2 ? 'opacity-0' : 'opacity-1',
        }}
      />
      {paymentStep === 'error' && (
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <DripSmall>oops</DripSmall>
          <Label1 className="text-primary-gray">
            something went wrong, let's try again
          </Label1>
          <PayButton />
        </div>
      )}

      {isDev() && seconds > 50 && 'transactionHash' in cart && (
        <Mono className="text-[8px] text-center">{cart.transactionHash}</Mono>
      )}

      {isPaidOrder(cart) && <StatusListener order={cart} />}
    </div>
  );
};

export default function ({ cart, shop }: { cart: Order; shop: Shop }) {
  return (
    <AsCheckoutSlide>
      <PaymentSlide cart={cart} shop={shop} />
    </AsCheckoutSlide>
  );
}
