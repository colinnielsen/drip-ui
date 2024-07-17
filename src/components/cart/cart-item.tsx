import { OrderItem } from '@/data-model/order/OrderType';
import Image from 'next/image';
import { Price } from '../icons';
import { Headline, Label2 } from '../ui/typography';
import { NumberInput } from '../ui/number-input';
import { useState } from 'react';

export function CartItem({ item }: { item: OrderItem }) {
  const [quantity, setQuantity] = useState(1);
  return (
    <div className="flex items-start gap-4 w-full">
      <div className="rounded-2xl overflow-hidden h-24 w-24 relative">
        <Image src={item.item.image} alt="coffee" fill />
      </div>

      <div className="flex flex-col gap-y-1">
        <Headline>{item.item.name}</Headline>
        <div className="flex gap-y-1">
          {item.mods.map(m => (
            <Label2 className="text-primary-gray" key={m.id}>
              {m.name} x{Number(m.value)}
            </Label2>
          ))}
        </div>
        <Price price={item.item.price} />
      </div>

      <div className="flex-1 justify-end flex">
        <NumberInput
          value={quantity}
          useTrashForDelete
          onPlus={() => setQuantity(quantity + 1)}
          onMinus={() => setQuantity(quantity - 1)}
        />
      </div>
    </div>
  );
}
