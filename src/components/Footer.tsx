import Link from 'next/link';
import CartFooter from './cart/cart-footer';
import { HomeSvg, MapSvg, ProfileSvg } from './icons';

export function Footer() {
  return (
    <footer className="fixed bottom-0 w-full shadow-lg">
      <CartFooter />
      <div className="flex justify-between bg-background py-4">
        <Link href="/" className="flex justify-center w-1/3">
          <HomeSvg />
        </Link>
        <div className="flex justify-center w-1/3">
          <MapSvg />
        </div>
        <div className="flex justify-center w-1/3">
          <ProfileSvg />
        </div>
      </div>
    </footer>
  );
}
