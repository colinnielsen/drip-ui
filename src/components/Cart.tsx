import Image from "next/image";
import { CartSvg, Price } from "./Helpers";
import {
  DrawerTrigger,
  Drawer,
  DrawerContent,
} from "./shadcn/drawer";
import coffee from "@/assets/coffee.jpg";

export function CartBanner() {
  return (
    <DrawerTrigger asChild>
      <div className="flex justify-between px-4 py-2 items-center bg-[#6F4827] text-white">
        <div>
          <p>Pickup Store</p>
          <div className="flex items-center gap-2">
            <p>Starbucks</p>
            <div className="rounded-full h-1 w-1 bg-white"></div>
            <p> 0.7mi</p>
          </div>
        </div>
        <CartSvg />
      </div>
    </DrawerTrigger>
  );
}

export function Cart() {
  return (
    <Drawer>
      <CartBanner />
      <DrawerContent className="flex flex-col p-4 gap-5">
        <p>Starbucks</p>
        <CheckoutItem />
        <CheckoutItem />
        <CheckoutItem />
      </DrawerContent>
    </Drawer>
  );
}

export function CheckoutItem() {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-xl overflow-hidden h-24 w-24">
        <Image src={coffee} alt="coffee" />
      </div>
      <div>
        <p>Cold Brew</p>
        <p>espresso shot</p>
        <p>iced</p>
        <Price price={3.99} />
      </div>
    </div>
  );
}
