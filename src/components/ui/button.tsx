import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import * as React from 'react';
import { Skeleton } from './skeleton';
import { Mono } from './typography';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
      variant: {
        cta: 'flex-grow bg-secondary-pop rounded-[50px] h-14 max-h-14 flex flex-col justify-center text-white',
        'cta-small':
          'flex-grow bg-secondary-pop rounded-[50px] h-10 max-h-10 flex flex-col justify-center text-white text-[14px]',
        default: 'bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90',
        destructive: 'bg-red-500 text-gray-50 shadow-sm hover:bg-red-500/90',
        outline:
          'border border-gray-200 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900',
        secondary: 'flex-grow bg-light-gray rounded-[50px] h-14 max-h-14',
        'secondary-small':
          'flex-grow bg-light-gray rounded-[50px] h-10 max-h-10 justify-center text-[14px]',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-gray-900 underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const classnm = buttonVariants({ size, variant });
    return <Comp className={cn(classnm, className)} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

const CTAButton = React.forwardRef(
  (
    props: ButtonProps & { isLoading?: boolean; variant?: 'cta' | 'cta-small' },
    ref: React.Ref<HTMLButtonElement>,
  ) => {
    const { isLoading, children, ...rest } = props;
    const isSmall = props.variant === 'cta-small';
    return (
      <Button
        variant={props.variant || 'cta'}
        {...rest}
        className="w-full"
        disabled={isLoading || rest.disabled}
        ref={ref}
      >
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin stroke-white" />
        ) : (
          <Mono className={`uppercase ${isSmall ? 'text-[14px]' : ''}`}>
            {children}
          </Mono>
        )}
      </Button>
    );
  },
);

const LoadingCTAButton = () => {
  return (
    <Skeleton className="h-14 w-full rounded-[50px] bg-secondary-pop text-center flex justify-center items-center">
      <Mono className={`uppercase text-white text-md -mt-2 ml-4`}>...</Mono>
    </Skeleton>
  );
};

const SecondaryButton = React.forwardRef(
  (
    props: ButtonProps & {
      isLoading?: boolean;
      variant?: 'secondary' | 'secondary-small';
    },
    ref: React.Ref<HTMLButtonElement>,
  ) => {
    const { isLoading, children, ...rest } = props;
    const isSmall = props.variant === 'secondary-small';
    return (
      <Button
        variant={props.variant || 'secondary'}
        {...rest}
        className={cn(
          'w-full',
          `uppercase ${isSmall ? 'text-[14px]' : ''} 'text-[16px] leading-[21.1px] font-mono align-middle'`,
          rest.className,
        )}
        disabled={isLoading}
        ref={ref}
      >
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin stroke-white" />
        ) : (
          children
        )}
      </Button>
    );
  },
);

const LoadingSecondaryButton = () => (
  <Skeleton className="h-14 w-full rounded-[50px] bg-light-gray" />
);

export {
  Button,
  buttonVariants,
  CTAButton,
  LoadingCTAButton,
  LoadingSecondaryButton,
  SecondaryButton,
};
