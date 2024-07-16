import { Order } from '@/data-model/order/OrderType';
import { TESTING_USER_UUID } from '@/data-model/user/UserType';
import { useShop } from '@/queries/ShopQuery';
import { useCart } from '@/queries/OrderQuery';
import { X } from 'lucide-react';
import { CartSvg } from '@/components/Helpers';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { CartItem } from '@/components/cart/cart-item';

export const CartDrawer = (cart: Order) => {
  const { data: shop } = useShop(cart.shop);
  if (!shop) return null;

  return (
    <>
      <DrawerTrigger asChild>
        <div className="flex justify-between px-4 py-2 items-center bg-[#6F4827] text-white">
          <div>
            <p>Pickup Store</p>
            <div className="flex items-center gap-2">
              <p>{shop.label}</p>
              <div className="rounded-full h-1 w-1 bg-white"></div>
              <p> 0.7mi</p>
            </div>
          </div>
          <CartSvg />
        </div>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col p-4 gap-5 h-full">
        <DrawerClose asChild>
          <X />
        </DrawerClose>
        <DrawerTitle className="text-3xl">{shop.label}</DrawerTitle>
        {cart.orderItems.map((o, index) => (
          <CartItem {...o} key={index} />
        ))}
      </DrawerContent>
    </>
  );
};

export function CartFooter() {
  const { data: cart } = useCart(TESTING_USER_UUID);

  if (!cart) return null;
  return (
    <Drawer key={'drawer'}>
      <CartDrawer {...cart} />
    </Drawer>
  );
}
