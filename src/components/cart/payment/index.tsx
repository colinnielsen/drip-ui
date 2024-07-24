import drip from '@/assets/drip.jpg';
import { CTAButton, LoadingCTAButton } from '@/components/ui/button';
import { Label1, Title1 } from '@/components/ui/typography';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useConnectedWallet } from '@/queries/EthereumQuery';
import { SliceProvider } from '@slicekit/react';
import Image from 'next/image';
import { AsCheckoutSlide } from '../checkout-slides';
import { FarmerCard } from '../overview/farmer-card';
import { useNextSlide } from '@/components/ui/carousel';
import { useCartInSliceFormat } from '@/queries/OrderQuery';
import { usePayAndOrder } from '@/queries/SliceQuery';
import { useState } from 'react';

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
    const payAndOrder = usePayAndOrder({ onSuccess: () => nextSlide() });

    const purchase = async () => {
      if (!payAndOrder) return;

      setLoading(true);
      await payAndOrder()
        .then(() => nextSlide())
        .finally(() => setLoading(false));
    };

    return (
      <CTAButton onClick={purchase} isLoading={loading}>
        pay
      </CTAButton>
    );
  };

export const PayButton = () => {
  const wallet = useConnectedWallet();

  const { data: cart } = useCartInSliceFormat({
    buyerAddress: wallet?.address,
  });

  if (!cart || !wallet) return <LoadingCTAButton />;

  return (
    <SliceProvider initCart={cart}>
      <UnderlyingPaymentButton
      //  sliceCart={cart} buyer={wallet.address}
      />
    </SliceProvider>
  );
};

const PaymentSlide = ({ cart, shop }: { cart: Order; shop: Shop }) => {
  if (!cart) return null;

  return (
    <div className="h-full bg-background flex flex-col items-center justify-center px-6 gap-4 py-6">
      <Image src={drip} alt="drip-logo" />
      <Title1>Brewing your coffee onchain...</Title1>
      <Label1>
        Crypto powers cross-border transactions so you can support farmers like
        Marco
      </Label1>
      <FarmerCard {...{ order: cart }} />
      <div className="flex-grow" />
      <PayButton />
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
