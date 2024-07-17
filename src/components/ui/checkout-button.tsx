import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './button';

export default function ({ children, ...props }: ButtonProps) {
  return (
    <Button className={cn('bg-secondary-pop py-6', props.className)} {...props}>
      {children}
    </Button>
  );
}
