import { Divider } from '@/components/ui/divider';
import {
  DrawerClose,
  DrawerFooter,
  DrawerTitle,
  useNearestDrawer,
} from '@/components/ui/drawer';
import { Title1 } from '@/components/ui/typography';
import {
  collapseDuplicateItems,
  isPaidOrder,
} from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useShop } from '@/queries/ShopQuery';
import { X } from 'lucide-react';
import { Fragment } from 'react';
import { AsCheckoutSlide } from '../checkout-slides';
import { OrderConfirmation } from '../order-confirmation/order-confirmation';
import { AddTipSection } from './add-tip';
import { CartItem, LoadingCartItem } from './cart-item';
import { FarmerCard } from './farmer-card';
import { FooterTotal } from './footer-total';
import { NextButton } from './next-button';
import { OrderSummary } from './summary';

export const EmptyBasket = () => {
  const { setOpen } = useNearestDrawer();
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

export default function Basket({ cart, shop }: { cart: Order; shop: Shop }) {
  const orderItems = collapseDuplicateItems(cart.orderItems);
  const isPaid = isPaidOrder(cart);
  const { setOpen } = useNearestDrawer();
  const { isFetching } = useShop({ id: shop.id });
  return (
    <AsCheckoutSlide>
      {isPaid ? (
        <OrderConfirmation cart={cart} shop={shop} />
      ) : (
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
              {shop.label}
            </Title1>
          </DrawerTitle>
          <div className="flex-grow" />
          <div className="flex flex-col gap-6 pt-4">
            {orderItems.map(([orderItem, quantity], index) => (
              <Fragment key={index}>
                <CartItem
                  {...{
                    orderItem,
                    quantity,
                    shopId: shop.id,
                    orderId: cart.id,
                    isLoading: isFetching,
                  }}
                />
                <Divider />
              </Fragment>
            ))}
          </div>

          {shop.tipConfig.enabled && (
            <>
              <AddTipSection cart={cart} shopId={shop.id} />
              <Divider />
            </>
          )}

          <OrderSummary cart={cart} isLoading={isFetching} />

          <Divider />

          <div className="p-6">
            <FarmerCard {...{ order: cart, className: 'h-28' }} />
          </div>

          <DrawerFooter className="p-0 w-full">
            <FooterTotal cart={cart} isLoading={isFetching} />
            <NextButton />
          </DrawerFooter>
        </>
      )}
    </AsCheckoutSlide>
  );
}
