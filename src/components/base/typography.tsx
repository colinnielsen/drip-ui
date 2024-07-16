import { cn } from '@/lib/utils';

export const Title1 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2
      className={cn(
        'text-[32px] font-garamond leading-[36.9px] align-middle',
        className,
      )}
    >
      {children}
    </h2>
  );
};

export const Title2 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2
      className={cn(
        'text-[24px] font-garamond leading-[27.6px] align-middle',
        className,
      )}
    >
      {children}
    </h2>
  );
};

export const Label1 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        'text-[14px] leading-[17px] font-libreFranklin align-middle',
        className,
      )}
    >
      {children}
    </p>
  );
};

export const Label2 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        'text-[12px] leading-[17px] font-libreFranklin font-medium align-middle',
        className,
      )}
    >
      {children}
    </p>
  );
};

export const Label3 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        'text-[14px] leading-[17px] font-libreFranklin font-semibold align-middle',
        className,
      )}
    >
      {children}
    </p>
  );
};

export const Headline = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        'text-[16px] leading-[19.4px] font-libreFranklin font-semibold align-middle',
        className,
      )}
    >
      {children}
    </p>
  );
};

export const Body = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        'text-[16px] leading-[19.4px] font-libreFranklin align-middle',
        className,
      )}
    >
      {children}
    </p>
  );
};
