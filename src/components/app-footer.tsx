import { cn } from '@/lib/utils';
import { Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { HomeSvg, ProfileSvg } from './ui/icons';

const LazyCartFooter = dynamic(() => import('./cart/status-footer'), {
  ssr: false,
});

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
        <Link href="/wallet" className="flex justify-center w-1/3">
          <Wallet strokeWidth={1.5} />
        </Link>
        <div className="flex justify-center w-1/3">
          <Link href="/me">
            <ProfileSvg />
          </Link>
        </div>
      </div>
    </footer>
  );
}
