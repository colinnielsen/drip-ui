import { cn } from '@/lib/utils';
import { Minus, Plus, Trash, Trash2 } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { Label2 } from './typography';

export function NumberInput({
  onPlus,
  onMinus,
  value,
  useTrashForDelete,
  className,
}: {
  onPlus: () => void;
  onMinus: () => void;
  value: number;
  useTrashForDelete?: boolean;
} & Partial<HTMLAttributes<HTMLInputElement>>) {
  const strokeWidth = '2px';
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 font-normal text-sm bg-light-gray w-fit rounded-2xl',
        className,
      )}
    >
      <button onClick={onMinus}>
        {value === 1 && useTrashForDelete ? (
          <Trash2 height={16} strokeWidth={strokeWidth} />
        ) : (
          <Minus height={16} strokeWidth={strokeWidth} />
        )}
      </button>
      <Label2>{value}</Label2>
      <button onClick={onPlus}>
        <Plus height={16} strokeWidth={strokeWidth} />
      </button>
    </div>
  );
}
