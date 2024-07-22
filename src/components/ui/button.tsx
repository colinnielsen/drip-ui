import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
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
        cta: 'flex-grow bg-secondary-pop rounded-[50px] h-14 flex flex-col justify-center',
        default: 'bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90',
        destructive: 'bg-red-500 text-gray-50 shadow-sm hover:bg-red-500/90',
        outline:
          'border border-gray-200 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900',
        secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-100/80',
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
    return (
      <Comp
        className={cn(buttonVariants({ size, className, variant }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

const CTAButton = (props: ButtonProps) => (
  <Button variant="cta" {...props}>
    <Mono className="text-white uppercase">{props.children}</Mono>
  </Button>
);

export { Button, buttonVariants, CTAButton };
