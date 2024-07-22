import { cn } from '@/lib/utils';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const Drip = ({
  as: Component = 'h1',
  className,
  children,
  ...rest
}: TypographyProps) => (
  <Component
    className={cn(
      'font-semibold font-drip text-4xl text-secondary-pop',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);

export const Title1 = ({
  as: Component = 'h2',
  className,
  children,
  ...rest
}: TypographyProps) => (
  <Component
    className={cn(
      'text-[32px] font-garamond leading-[36.9px] align-middle font-normal',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);

export const Title2 = ({
  as: Component = 'h2',
  className,
  children,
  ...rest
}: TypographyProps) => (
  <Component
    className={cn(
      'text-[24px] font-garamond leading-[27.6px] align-middle',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);

export const Label1 = ({
  as: Component = 'div',
  className,
  children,
  ...rest
}: TypographyProps) => (
  <Component
    className={cn(
      'text-[14px] leading-[17px] font-libreFranklin align-middle',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);

export const Label2 = ({
  as: Component = 'div',
  className,
  children,
  ...rest
}: TypographyProps) => (
  <Component
    className={cn(
      'text-[14px] leading-[17px] font-libreFranklin font-medium align-middle',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);

export const Label3 = ({
  as: Component = 'div',
  className,
  children,
  ...rest
}: TypographyProps) => (
  <Component
    className={cn(
      'text-[14px] leading-[17px] font-libreFranklin font-semibold align-middle',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);

export const Headline = ({
  as: Component = 'div',
  className,
  children,
  ...rest
}: TypographyProps) => (
  <Component
    className={cn(
      'text-[16px] leading-[19.4px] font-libreFranklin font-semibold align-middle',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);

export const Body = ({
  as: Component = 'div',
  className,
  children,
  ...rest
}: TypographyProps) => (
  <Component
    className={cn(
      'text-[16px] leading-[19.4px] font-libreFranklin align-middle',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);

export const Mono = ({
  as: Component = 'div',
  className,
  children,
  ...rest
}: TypographyProps) => (
  <Component
    className={cn(
      'text-[16px] leading-[21.1px] font-mono align-middle',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);
