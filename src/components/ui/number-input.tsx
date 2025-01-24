import { cn } from '@/lib/utils';
import { Minus, Plus, Trash, Trash2 } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { Label2 } from './typography';

export function NumberInput({
  disabled,
  onPlus,
  onMinus,
  value,
  useTrashForDelete,
  className,
}: {
  disabled?: boolean;
  onPlus: () => void;
  onMinus: () => void;
  value: number;
  useTrashForDelete?: boolean;
} & Partial<HTMLAttributes<HTMLInputElement>>) {
  const strokeWidth = '2px';
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 font-normal text-sm bg-light-gray rounded-2xl w-[105px] justify-between',
        className,
      )}
    >
      <button onClick={onMinus} disabled={disabled}>
        {value === 1 && useTrashForDelete ? (
          <Trash2 height={16} strokeWidth={strokeWidth} />
        ) : (
          <Minus
            height={16}
            strokeWidth={strokeWidth}
            className={cn({
              'text-primary-gray': value === 1,
            })}
          />
        )}
      </button>
      <div className="flex items-center justify-center grow">
        <Label2>{value}</Label2>
      </div>
      <button onClick={onPlus}>
        <Plus height={16} strokeWidth={strokeWidth} />
      </button>
    </div>
  );
}
