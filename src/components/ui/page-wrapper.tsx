import { cn, isIOSSafari } from '@/lib/utils';

export const PageWrapper = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex flex-col min-h-screen pb-32',
        {
          'pb-52': !isIOSSafari(),
        },
        className,
      )}
    >
      {children}
    </div>
  );
};
