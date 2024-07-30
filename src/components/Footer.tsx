import Link from 'next/link';
import { HomeSvg, MapSvg, ProfileSvg } from './ui/icons';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const LazyCartFooter = dynamic(() => import('./cart/footer'), { ssr: false });

export function Footer() {
  return (
    <footer className="fixed h-fit bottom-0 w-full flex flex-col">
      <LazyCartFooter />
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
          <ProfileSvg />
        </div>
      </div>
    </footer>
  );
}
