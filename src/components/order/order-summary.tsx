import { mapOrderStatusToStatusLabel } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import Image from 'next/image';
import { Button } from '../ui/button';
import { AnimatedTimer } from '../ui/icons';
import { Skeleton } from '../ui/skeleton';
import { Headline, Label2, Mono } from '../ui/typography';

export const SkeletonOrderSummary = () => {
  return (
    <div className="flex w-full min-h-[82px] gap-6 items-start justify-evenly">
      <Skeleton className="h-20 w-20 rounded-full" />

      <div className="flex flex-col gap-1 whitespace-nowrap">
        <Skeleton>
          <Headline className="invisible">Loading...</Headline>
        </Skeleton>
        <Skeleton>
          <Label2 className="invisible">Order #000000</Label2>
        </Skeleton>
        <Skeleton>
          <Label2 className="invisible">0 items</Label2>
        </Skeleton>
      </div>

      <Skeleton className="rounded-[50px]">
        <Button className="px-4 py-2.5 uppercase rounded-[50px] bg-secondary-pop invisible">
          <Mono className="text-[14px]">view</Mono>
        </Button>
      </Skeleton>
    </div>
  );
};

export const OrderSummary = ({
  order,
  shopLogo,
  shopLabel,
  onClick,
}: {
  order: Order;
  shopLogo: string;
  shopLabel: string;
  onClick: () => void;
}) => {
  return (
    <div
      key={order.id}
      className="flex w-full min-h-[82px] gap-6 items-start h-auto transition-all duration-300"
    >
      <div className="overflow-hidden h-20 min-w-20 relative border border-light-gray rounded-full">
        <Image
          src={shopLogo}
          alt={shopLabel}
          quality={20}
          fill={true}
          className="object-contain"
        />
      </div>

      <div className="flex flex-col gap-1 whitespace-nowrap overflow-hidden">
        <Headline>{shopLabel}</Headline>
        {order.externalOrderInfo?.orderNumber ? (
          <Label2 className="whitespace-nowrap text-ellipsis overflow-hidden">
            Order #{order.externalOrderInfo.orderNumber}
          </Label2>
        ) : null}
        <Label2>{order.lineItems.length} items</Label2>
        <Label2>${order.totalAmount.prettyFormat()}</Label2>
        {order.status === '1-submitting' || order.status === '2-in-progress' ? (
          <div className="flex items-center">
            <Label2>
              {mapOrderStatusToStatusLabel(order.status)}
              {(order.status === '1-submitting' ||
                order.status === '2-in-progress') && (
                <AnimatedTimer
                  height={14}
                  className="inline stroke-primary-gray"
                />
              )}
            </Label2>
          </div>
        ) : null}
      </div>

      <div className="flex grow justify-end">
        <Button
          onClick={onClick}
          className="px-4 py-2.5 uppercase rounded-[50px] bg-secondary-pop"
        >
          <Mono className="text-[14px]">view</Mono>
        </Button>
      </div>
    </div>
  );
};
