import coffeeGif from '@/assets/coffee-dive.gif';
import { CTAButton, LoadingCTAButton } from '@/components/ui/button';
import { useNextSlide } from '@/components/ui/carousel';
import { Drip, Label1, Mono } from '@/components/ui/typography';
import { isPaidOrder } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useSecondsSinceMount } from '@/lib/hooks/utility-hooks';
import { useConnectedWallet } from '@/queries/EthereumQuery';
import {
  useCart,
  useCartInSliceFormat,
  useCheckOrderStatus,
} from '@/queries/OrderQuery';
import { usePayAndOrder } from '@/queries/SliceQuery';
import { SliceProvider } from '@slicekit/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FarmerCard } from '../basket/farmer-card';
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
    const [loading, setLoading] = useState(false);
    const nextSlide = useNextSlide();
    const payAndOrder = usePayAndOrder();

    const purchase = async () => {
      if (!payAndOrder) return;

      nextSlide?.();
      setLoading(true);
      await payAndOrder().finally(() => setLoading(false));
    };

    return (
      <CTAButton onClick={purchase} isLoading={loading}>
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
      <UnderlyingPaymentButton
      //  sliceCart={cart} buyer={wallet.address}
      />
    </SliceProvider>
  );
};

const StatusListener = ({ order }: { order: Order }) => {
  const nextSlide = useNextSlide();
  const { mutateAsync: checkStatus } = useCheckOrderStatus();
  const [complete, setComplete] = useState(false);
  const seconds = useSecondsSinceMount();

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('interval');
      checkStatus(order.id).then(d => {
        if (d.status !== 'pending' && d.status !== 'submitting') {
          setComplete(true);
          clearInterval(interval);
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (seconds > 4 && complete) nextSlide?.();
  }, [seconds, complete]);

  return null;
};

const PaymentSlide = ({ cart, shop }: { cart: Order; shop: Shop }) => {
  // const data = useFarmerAllocationFromOrder(cart);

  // lol
  const MAX_DOTS = 4;
  const seconds = useSecondsSinceMount();

  const dots = Array.from({ length: seconds % MAX_DOTS }, () => '.');

  return (
    <div className="h-full bg-background flex flex-col items-center justify-center px-6 gap-4 py-6 w-full">
      <div className="flex items-center justify-center h-[280px] w-[280px] overflow-clip">
        <Image src={coffeeGif} alt="loading bar" width={280} />
      </div>
      <Drip className="text-2xl text-center">
        your order's brewing
        <br />
        {/* brewing <br />your coffee onchain */}
      </Drip>
      <Label1 className="text-primary-gray text-center text-md">
        (via onchain superpowers)
        {/* {Array.from({ length: dotCount }).map(() => '.')} */}
      </Label1>
      <div className="h-12" />
      {/* fade this farmer card in after dotCount >= 2 */}
      <FarmerCard
        {...{
          order: cart,
          showPics: true,
          className: seconds <= 2 ? 'opacity-0' : 'opacity-1',
        }}
      />
      {/* <FarmerIntroCardWrapper
        {...{ farmer: data?.farmer.id, allocationBPS: data?.allocation.allocationBPS }}
      /> */}
      {/* <div className="flex-grow" /> */}
      {/* <PayButton /> */}
      {seconds > 15 && (
        <Mono className="text-[8px] text-center">
          {cart.status !== 'pending' && cart.transactionHash}
        </Mono>
      )}
      {!isPaidOrder(cart) && <StatusListener order={cart} />}
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
