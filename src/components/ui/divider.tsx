import { cn } from '@/lib/utils';

export const Divider = ({ className }: { className?: string }) => {
  return (
    <div className={cn('w-full', 'border-b border-light-gray', className)} />
  );
};
