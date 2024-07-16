import { Order } from '@/data-model/order/OrderType';
import { TESTING_USER_UUID } from '@/data-model/user/UserType';
import { useShop } from '@/queries/ShopQuery';
import { useCart } from '@/queries/OrderQuery';
import { ShoppingCart, X } from 'lucide-react';
import { CartSvg } from '@/components/icons';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { CartItem } from '@/components/cart/cart-item';
import { Headline, Label1, Label2, Mono, Title1 } from '../base/typography';
import { Button } from '../ui/button';
import { Fragment } from 'react';
import { Divider } from '../base/Divider';

export const CartDrawer = (cart: Order) => {
  const { data: shop } = useShop(cart.shop);
  if (!shop) return null;

  return (
    <>
      <DrawerTrigger asChild>
        <div className="flex justify-between px-6 py-4 items-center bg-secondary-pop">
          <div className="flex flex-col gap-1">
            <Label2 className="text-light-gray">Pickup Store</Label2>
            <Headline className="flex items-center gap-2 text-light-gray">
              <p>{shop.label}</p>
              <div className="rounded-full h-1 w-1 bg-white"></div>
              <p> 0.7mi</p>
            </Headline>
          </div>
          <div className="relative flex justify-center items-center">
            <ShoppingCart
              height={40}
              width={40}
              color="white"
              strokeWidth={1.5}
            />
            <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center">
              <div className="text-white text-xs leading-none font-bold font-libreFranklin ml-1">
                {cart.orderItems.length}
              </div>
            </div>
          </div>
        </div>
      </DrawerTrigger>

      <DrawerContent className="flex flex-col px-6 h-full bg-background">
        <DrawerClose asChild>
          <div className="flex justify-start h-14 w-full items-center">
            <X height={24} width={24} />
          </div>
        </DrawerClose>
        <DrawerTitle>
          <Title1>{shop.label}</Title1>
        </DrawerTitle>
        <div className="flex flex-col gap-6 pt-4">
          {cart.orderItems.map((item, index) => (
            <Fragment key={index}>
              <CartItem key={index} item={item} />
              <Divider />
            </Fragment>
          ))}
        </div>
        <DrawerFooter>
          <Button className="bg-secondary-pop py-6">
            <Mono className="uppercase">Checkout</Mono>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </>
  );
};

export default function () {
  const { data: cart } = useCart(TESTING_USER_UUID);

  if (!cart) return null;
  return (
    <Drawer key={'drawer'}>
      <CartDrawer {...cart} />
    </Drawer>
  );
}
