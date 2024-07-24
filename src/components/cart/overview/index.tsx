import emptyCart from '@/assets/empty-cart.jpg';
import { Divider } from '@/components/ui/divider';
import { DrawerClose, DrawerFooter, DrawerTitle } from '@/components/ui/drawer';
import { Drip, Label1, Title1 } from '@/components/ui/typography';
import { collapseDuplicateItems } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useConnectedWallet } from '@/queries/EthereumQuery';
import { useCartInSliceFormat } from '@/queries/OrderQuery';
import { useActiveUser } from '@/queries/UserQuery';
import { SliceProvider, useCart as useSliceCart } from '@slicekit/react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Fragment, ReactNode, useEffect } from 'react';
import { AsCheckoutSlide } from '../checkout-slides';
import { AddTipSection } from './add-tip';
import { CartItem } from './cart-item';
import { FarmerCard } from './farmer-card';
import { FooterTotal } from './footer-total';
import { NextButton } from './next-button';
import { OrderSummary } from './summary';

export const EmptyOverview = () => {
  return (
    <>
      <div className="flex justify-start w-full items-center px-6 py-4">
        <DrawerClose asChild>
          <button>
            <X height={24} width={24} />
          </button>
        </DrawerClose>
      </div>

      <DrawerTitle>
        <Title1 as="div" className="text-palette-foreground px-6">
          Cart
        </Title1>
      </DrawerTitle>

      <div className="flex-grow flex justify-center items-center flex-col gap-4">
        <Image src={emptyCart} alt="empty cart" />
        <Drip className="text-lg">Your cart is empty</Drip>
        <Label1>Go get some ☕️</Label1>
      </div>

      <DrawerFooter className="p-0 w-full">
        {/* <CtaButton>Add to cart</CtaButton> */}
      </DrawerFooter>
    </>
  );
};

const Overview = ({ cart, shop }: { cart: Order; shop: Shop }) => {
  const { data: user } = useActiveUser();

  if (!user) return null;

  const orderItems = collapseDuplicateItems(cart.orderItems);

  return (
    <>
      <div className="flex justify-start w-full items-center px-6 py-4">
        <DrawerClose asChild>
          <button>
            <X height={24} width={24} />
          </button>
        </DrawerClose>
      </div>

      <DrawerTitle>
        <Title1 as="div" className="text-palette-foreground px-6">
          {shop.label}
        </Title1>
      </DrawerTitle>

      <div className="flex-grow" />

      <div className="flex flex-col gap-6 pt-4">
        {orderItems.map(([orderItem, quantity], index) => (
          <Fragment key={index}>
            <CartItem
              {...{ orderItem, quantity, shopId: shop.id, userId: user.id }}
            />
            <Divider />
          </Fragment>
        ))}
      </div>

      <AddTipSection cart={cart} shopId={shop.id} userId={user.id} />

      <Divider />

      <OrderSummary cart={cart} />

      <Divider />

      <FarmerCard {...{ order: cart }} />

      <DrawerFooter className="p-0 w-full">
        <FooterTotal cart={cart} />
        <NextButton />
      </DrawerFooter>
    </>
  );
};

const SliceCartListener = ({ children }: { children: ReactNode }) => {
  const { updateCart } = useSliceCart();

  const wallet = useConnectedWallet();
  const { data: sliceCart } = useCartInSliceFormat({
    buyerAddress: wallet?.address,
  });

  useEffect(() => {
    if (sliceCart) {
      console.log('hydrating cart', sliceCart);
      updateCart(sliceCart);
    }
  }, [sliceCart]);

  return <>{children}</>;
};

export default function ({ cart, shop }: { cart: Order; shop: Shop }) {
  return (
    <SliceProvider>
      <SliceCartListener>
        <AsCheckoutSlide>
          <Overview cart={cart} shop={shop} />
        </AsCheckoutSlide>
      </SliceCartListener>
    </SliceProvider>
  );
}
