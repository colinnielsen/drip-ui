import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTrigger,
  useCartDrawer,
} from '@/components/ui/drawer';
import { Cart } from '@/data-model/cart/CartType';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { usePrevious } from '@/lib/hooks/utility-hooks';
import { cn, sleep } from '@/lib/utils';
import { CSS_FONT_CLASS_CONFIG } from '@/pages/_app';
import { useCart } from '@/queries/CartQuery';
import { useRecentOrder } from '@/queries/OrderQuery';
import { useShop } from '@/queries/ShopQuery';
import { CheckCircle, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AnimatedTimer } from '../ui/icons';
import { Headline, Label2 } from '../ui/typography';
import CheckoutSlides from './checkout-slides';
import { OrderConfirmation } from './order-confirmation/order-confirmation';

type FooterData =
  | { type: 'cart'; cart: Cart; shop: Shop }
  | { type: 'pending-order'; order: Order; shop: Shop };

export const FooterButtonTrigger = (props: FooterData) => {
  const { shop } = props;

  const [label, headline] =
    props.type === 'cart'
      ? ['Pickup store', shop?.label]
      : [
          props.order?.externalOrderInfo?.orderNumber
            ? `Order #${props.order?.externalOrderInfo?.orderNumber}`
            : '',
          shop?.label,
        ];

  const [cartItemCount, setCartItemCount] = useState(0);
  const cartIconRef = useRef<HTMLDivElement>(null);

  const itemCount =
    (props.type === 'cart' ? props.cart : props.order)?.lineItems?.reduce(
      (acc, lineItem) => acc + lineItem.quantity,
      0,
    ) || 0;

  useEffect(() => {
    if (itemCount !== cartItemCount && itemCount > 1) {
      setCartItemCount(itemCount || 0);
      cartIconRef.current?.classList.add('animate-cart-shake');
      setTimeout(() => {
        cartIconRef.current?.classList.remove('animate-cart-shake');
      }, 500);
    }
  }, [itemCount]);

  const rightIcon = (function () {
    if (props.type === 'cart')
      return (
        <div
          ref={cartIconRef}
          className="transition-transform duration-300 ease-in-out"
        >
          <ShoppingCart
            height={40}
            width={40}
            color="white"
            strokeWidth={1.5}
          />
          <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center">
            <div className="text-white text-xs leading-none font-bold font-libreFranklin ml-1">
              {itemCount}
            </div>
          </div>
        </div>
      );

    if (props.type === 'pending-order') {
      if (props.order.status === '3-complete')
        return (
          <CheckCircle height={25} width={25} color="white" strokeWidth={1.5} />
        );
      if (
        props.order.status === '1-submitting' ||
        props.order.status === '2-in-progress'
      )
        return <AnimatedTimer />;
    }

    return null;
  })();

  return (
    <>
      <div className="flex flex-col gap-1">
        <Label2 className="text-light-gray">{label}</Label2>
        <Headline className="flex items-center gap-2 text-light-gray">
          <p>{headline}</p>
          <div className="rounded-full h-1 w-1 bg-white"></div>
          <p> 0.7mi</p>
        </Headline>
      </div>
      <div className="relative flex justify-center items-center">
        {rightIcon}
      </div>
    </>
  );
};

const useCartOpenAndCloseListener = (type?: FooterData['type']) => {
  const { setOpen } = useCartDrawer();

  const { data: cart } = useCart();
  const prevCart = usePrevious(cart);
  const prevType = usePrevious(type);

  useEffect(() => {
    if (prevCart && cart === null) setOpen(false);
    if (prevCart?.id && cart?.id && prevCart.id !== cart.id) setOpen(false);
    // when the type changes
    // if (prevType !== null && type !== null && prevType !== type) setOpen(false);
  }, [cart, prevCart, type, prevType]);
};

const useCartAndShopInfo = (): FooterData | null => {
  const { data: cart, isLoading: cartIsLoading } = useCart();
  const { data: recentOrder, isLoading: recentOrderLoading } = useRecentOrder();
  const {
    data: cartShop,
    // isLoading: cartShopLoading
  } = useShop({
    id: cart?.shop,
  });
  const {
    data: orderShop,
    // isLoading: orderShopLoading
  } = useShop({
    id: recentOrder?.shop,
  });

  if (cartIsLoading || recentOrderLoading) return null;
  if (cart) {
    if (!cartShop) return null;
    return { type: 'cart', shop: cartShop, cart };
  }
  if (recentOrder) {
    if (!orderShop) return null;
    return { type: 'pending-order', shop: orderShop, order: recentOrder };
  }

  return null;
};

export default function StatusBar() {
  const [ready, setIsReady] = useState(false);
  const data = useCartAndShopInfo();
  useCartOpenAndCloseListener(data?.type);

  const { open, setOpen } = useCartDrawer();

  useEffect(() => {
    sleep(1000).then(() => setIsReady(true));
  }, [data]);

  return (
    <Drawer open={open} dismissible={false}>
      {data && (
        <DrawerTrigger asChild>
          <button
            className={cn(
              'shadow-[4px_0px_60px_0px_rgba(0,0,0,0.20)]',
              'relative',
              'flex justify-between px-6 py-4 items-center bg-secondary-pop w-full text-left',
              'transition-all',
              'transition-[600ms]',
              ready ? 'top-0' : 'top-[100px]',
            )}
            onClick={() => setOpen(true)}
          >
            <FooterButtonTrigger {...data} />
          </button>
        </DrawerTrigger>
      )}

      <DrawerContent
        full
        className={cn('!bg-background', 'overscroll-y-contain')}
        aria-describedby="status-drawer"
      >
        <DrawerDescription className="hidden">
          {data?.type || ' info'}
        </DrawerDescription>

        {data?.type === 'cart' ? (
          <CheckoutSlides {...data} />
        ) : data?.type === 'pending-order' ? (
          <div className="flex flex-col w-screen h-screen overflow-y-scroll overflow-x-clip">
            <OrderConfirmation {...data} />
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
