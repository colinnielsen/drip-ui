import { Divider } from '@/components/ui/divider';
import {
  DrawerClose,
  DrawerFooter,
  DrawerTitle,
  useCartDrawer,
} from '@/components/ui/drawer';
import { Title1 } from '@/components/ui/typography';
import { Cart } from '@/data-model/cart/CartType';
import { Shop } from '@/data-model/shop/ShopType';
import { useShop } from '@/queries/ShopQuery';
import { X } from 'lucide-react';
import { Fragment } from 'react';
import { AsCheckoutSlide } from '../checkout-slides';
import { AddTipSection } from './add-tip';
import { LineItemComponent, LoadingCartItem } from './cart-item';
import { FooterTotal } from './footer-total';
import { NextButton } from './next-button';
import { CartSummary } from './summary';
import { FarmerCard } from './farmer-card';
import { mapOrderOrCartToPaymentSummary } from '@/data-model/order/OrderDTO';

export const EmptyBasket = () => {
  const { setOpen } = useCartDrawer();
  return (
    <>
      <div className="flex justify-start w-full items-center px-6 py-4">
        <DrawerClose asChild>
          <button onClick={() => setOpen(false)}>
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
        {/* <Image src={emptyCart} alt="empty cart" />
        <Drip className="text-lg">Your cart is empty</Drip>
        <Label1>Go get some ☕️</Label1> */}
      </div>

      <DrawerFooter className="p-0 w-full">
        {/* <CtaButton>Add to cart</CtaButton> */}
      </DrawerFooter>
    </>
  );
};

export const EmptyBasetSlide = () => {
  return (
    <AsCheckoutSlide>
      <EmptyBasket />
    </AsCheckoutSlide>
  );
};

export const LoadingBasketSlide = () => {
  return (
    <AsCheckoutSlide>
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
      <div className="flex-grow" />
      <div className="flex flex-col gap-6 pt-4">
        {new Array(3).fill(null).map((_, index) => (
          <Fragment key={index}>
            <LoadingCartItem />
            <Divider />
          </Fragment>
        ))}{' '}
      </div>
    </AsCheckoutSlide>
  );
};

export default function Basket({ cart, shop }: { cart: Cart; shop: Shop }) {
  const { setOpen } = useCartDrawer();
  const { isFetching } = useShop({ id: shop.id });
  const summary = mapOrderOrCartToPaymentSummary(cart);

  return (
    <AsCheckoutSlide>
      <div className="flex justify-start w-full items-center px-6 py-4">
        <DrawerClose asChild>
          <button onClick={() => setOpen(false)}>
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
      <div className="flex flex-col pt-4 divide-y divide-light-gray">
        {cart.lineItems.map((lineItem, index) => (
          <LineItemComponent
            key={index}
            {...{
              lineItem: lineItem,
              shopId: shop.id,
              orderId: cart.id,
              isLoading: isFetching,
            }}
          />
        ))}
      </div>

      {shop.tipConfig.enabled && (
        <>
          <AddTipSection cart={cart} shopId={shop.id} />
          <Divider />
        </>
      )}

      <Divider />

      <CartSummary
        isLoading={isFetching}
        hideTipIfZero={shop.tipConfig.enabled}
      />

      <Divider />

      <div className="p-6">
        <FarmerCard {...{ shopId: shop.id, className: 'h-28' }} />
      </div>

      <DrawerFooter className="p-0 w-full sticky bottom-0 bg-background shadow-[4px_0px_60px_0px_rgba(0,0,0,0.10)]">
        <FooterTotal summary={summary} isLoading={isFetching} />
        <NextButton shopType={shop.__sourceConfig.type} />
      </DrawerFooter>
    </AsCheckoutSlide>
  );
}
