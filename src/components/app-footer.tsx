import Link from 'next/link';
import { HomeSvg, MapSvg, ProfileSvg } from './ui/icons';
import dynamic from 'next/dynamic';
import CartFooter from '@/components/cart/footer';
import { cn } from '@/lib/utils';
import { useOrders, useCart } from '@/queries/OrderQuery';

// const LazyCartFooter = dynamic(() => import('./cart/footer'), { ssr: false });

export function Footer() {
  const { data: orders } = useOrders();
  const { data: cart } = useCart();
  console.log({ orders, cart });

  return (
    <footer className="fixed h-fit bottom-0 w-full flex flex-col">
      {/* <LazyCartFooter /> */}
      <CartFooter />
      <div
        className={cn(
          'flex justify-between bg-background py-4 w-full z-10',
          'shadow-[4px_0px_60px_0px_rgba(0,0,0,0.40)]',
        )}
      >
        <Link href="/" className="flex justify-center w-1/3">
          <HomeSvg />
        </Link>
        <div className="flex justify-center w-1/3">
          <MapSvg />
        </div>
        <div className="flex justify-center w-1/3">
          <Link href="/me">
            <ProfileSvg />
          </Link>
        </div>
      </div>
    </footer>
  );
}
