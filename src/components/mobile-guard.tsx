import Image from 'next/image';
import { Drip } from '@/components/ui/typography';
import { ReactNode } from 'react';

interface MobileGuardProps {
  children: ReactNode;
}

export const MobileGuard = ({ children }: MobileGuardProps) => {
  return (
    <>
      {/* Content for mobile viewports (below md) */}
      <div className="md:hidden">{children}</div>

      {/* Blocking overlay for tablet/desktop viewports (md and up) */}
      <div className="hidden md:flex fixed inset-0 z-50 flex-col items-center justify-center bg-background">
        <Image
          src="/drip-logo.png"
          alt="Drip logo"
          width={160}
          height={160}
          priority
        />
        <Drip className="mt-6 text-center">drip is for mobile users only</Drip>
      </div>
    </>
  );
};
