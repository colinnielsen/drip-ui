import { Order, OrderItem } from '@/data-model/order/OrderType';
import { TESTING_USER_UUID } from '@/data-model/user/UserType';
import { useCafe } from '@/queries/CafeQuery';
import { useCart } from '@/queries/OrderQuery';
import { X } from 'lucide-react';
import Image from 'next/image';
import { CartSvg, Price } from './Helpers';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';

export function CheckoutItem(o: OrderItem) {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-xl overflow-hidden h-24 w-24 relative">
        <Image src={o.item.image} alt="coffee" fill />
      </div>
      <div>
        <p>{o.item.name}</p>
        {o.mods.map(m => (
          <p key={m.id}>
            {m.name} x{Number(m.value)}
          </p>
        ))}
        <Price price={o.item.price} />
      </div>
    </div>
  );
}

export const Cart = (cart: Order) => {
  const { data: cafe } = useCafe(cart.cafe);
  if (!cafe) return null;

  return (
    <>
      <DrawerTrigger asChild>
        <div className="flex justify-between px-4 py-2 items-center bg-[#6F4827] text-white">
          <div>
            <p>Pickup Store</p>
            <div className="flex items-center gap-2">
              <p>{cafe.label}</p>
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
        <DrawerTitle className="text-3xl">{cafe.label}</DrawerTitle>
        {cart.orderItems.map((o, index) => (
          <CheckoutItem {...o} key={index} />
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
      <Cart {...cart} />
    </Drawer>
  );
}
