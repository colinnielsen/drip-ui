import { cn } from '@/lib/utils';

export const InfoCard = ({
  className,
  info,
  left,
}: {
  className?: string;
  info: React.ReactNode;
  left: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'min-h-28 flex gap-x-0 bg-secondary-background rounded-3xl overflow-clip items-center transition-opacity duration-500',
        className,
      )}
    >
      <div className="h-full aspect-square relative flex items-center justify-center w-1/3">
        {left}
      </div>
      <div className="w-full flex p-4">{info}</div>
    </div>
  );
};
