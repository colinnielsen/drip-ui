import { Minus, Plus, Trash, Trash2 } from 'lucide-react';
import { HTMLAttributes } from 'react';

export function NumberInput({
  onPlus,
  onMinus,
  value,
  useTrashForDelete,
}: {
  onPlus: () => void;
  onMinus: () => void;
  value: number;
  useTrashForDelete?: boolean;
} & Partial<HTMLAttributes<HTMLInputElement>>) {
  const strokeWidth = '2px';
  return (
    <div className="flex items-center gap-2 px-4 py-2 font-normal text-sm bg-neutral-100 w-fit rounded-2xl">
      <button onClick={onMinus}>
        {value === 1 && useTrashForDelete ? (
          <Trash2 height={16} strokeWidth={strokeWidth} />
        ) : (
          <Minus height={16} strokeWidth={strokeWidth} />
        )}
      </button>
      <p>{value}</p>
      <button onClick={onPlus}>
        <Plus height={16} strokeWidth={strokeWidth} />
      </button>
    </div>
  );
}
