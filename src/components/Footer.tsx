import Link from 'next/link';
import CartFooter from './cart/footer';
import { HomeSvg, MapSvg, ProfileSvg } from './ui/icons';

export function Footer() {
  return (
    <footer className="fixed h-fit bottom-0 w-full flex flex-col">
      <CartFooter />
      <div className="flex justify-between bg-background py-4 w-full z-10">
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
