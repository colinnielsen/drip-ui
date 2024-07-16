import { OrderItem } from '@/data-model/order/OrderType';
import Image from 'next/image';
import { Price } from '../Helpers';

export function CartItem(o: OrderItem) {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-xl overflow-hidden h-24 w-24 relative">
        <Image src={o.item.image} alt="coffee" fill />
      </div>
      <div>
        <p>{o.item.name}</p>
        {o.mods.map(m => (
          <p key={m.id}>
            {m.name} x{Number(m.value)}
          </p>
        ))}
        <Price price={o.item.price} />
      </div>
    </div>
  );
}
