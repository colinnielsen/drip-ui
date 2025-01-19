import { OrderItemDisplay } from '@/components/cart/basket/cart-item';
import { CTAButton, SecondaryButton } from '@/components/ui/button';
import {
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Headline, Label2, Title1 } from '@/components/ui/typography';
import {
  getOrderNumber,
  mapOrderStatusToStatusLabel,
  mapOrderToPaymentSummary,
} from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { basescanTxUrl } from '@/lib/ethereum';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { isHex } from 'viem';
import { CostSummary } from '../cart/basket/summary';
import { AdditionalOrderDistributions } from '../order/additional-distributions';

export const OrderDetail = ({
  order,
  shopLabel,
  onClose,
}: {
  order?: Order | null;
  shopLabel: string;
  onClose: () => void;
}) => {
  if (order?.status === 'error') console.error(order.errorDetails);

  return (
    <DrawerContent className="">
      <div className="flex flex-col h-screen overflow-scroll">
        <DrawerHeader className="h-14 flex items-center justify-evenly py-4 px-6">
          <div className="w-full">
            <DrawerClose asChild onClick={onClose}>
              <ArrowLeft height={24} width={24} strokeWidth={2.4} />
            </DrawerClose>
          </div>
          <DrawerTitle asChild>
            <Headline className="text-palette-foreground px-6 whitespace-nowrap w-full text-[16px] leading-[19.4px] font-libreFranklin font-semibold">
              {order && getOrderNumber(order)
                ? `Order #${getOrderNumber(order)}`
                : 'Order'}
            </Headline>
          </DrawerTitle>
          <div className="w-full" />
        </DrawerHeader>
        <div className="flex flex-col py-2 gap-2">
          <Title1 className="text-palette-foreground px-6">{shopLabel}</Title1>
          <div className="flex gap-2 px-6">
            <Label2
              className={cn({
                'text-secondary-pop': order?.status === '3-complete',
                'text-yellow-600': order?.status === '2-in-progress',
                'text-red-700': order?.status === 'cancelled',
              })}
            >
              Order{' '}
              {order?.status &&
                mapOrderStatusToStatusLabel(order?.status, 'past')}
            </Label2>
            <Label2>
              {order?.timestamp &&
                format(new Date(order.timestamp), 'PPp')
                  .split(', ')
                  .map((s, i) => (i === 1 ? `${s} at` : `${s},`))
                  .join(' ')
                  .slice(0, -1)}
            </Label2>
          </div>
          {order?.status === 'error' && (
            <Label2 className="text-red-500 px-6">
              {order.errorDetails?.message}
            </Label2>
          )}
        </div>
        <div className="flex flex-col w-full py-2 divide-y divide-light-gray">
          {order?.lineItems &&
            order.lineItems.map((lineItem, index) => {
              return (
                <div key={index} className="py-6 w-full first:pt-0 last:pb-0">
                  <OrderItemDisplay
                    lineItem={lineItem}
                    // rightSide={
                    //   <div
                    //     className={
                    //       'flex items-center gap-2 px-4 py-2 font-normal text-sm bg-light-gray rounded-2xl justify-between'
                    //     }
                    //   >
                    //     <div className="flex items-center justify-center grow">
                    //       <Label2 className="text-black">{quantity}</Label2>
                    //     </div>
                    //   </div>
                    // }
                  />
                </div>
              );
            })}
          <CostSummary
            summary={mapOrderToPaymentSummary(order)}
            isLoading={!order}
            hideTipIfZero
          />
          <div className="px-6 py-6">
            {order?.additionalDistributions?.length && (
              <AdditionalOrderDistributions
                distributions={order.additionalDistributions}
                orderTotal={order.totalAmount}
              />
            )}
          </div>
        </div>
        <DrawerFooter>
          <div className="flex flex-col px-4 gap-2 justify-center items-center">
            {order &&
              'transactionHash' in order &&
              isHex(order.transactionHash) && (
                <Link
                  className="w-full"
                  href={basescanTxUrl(order?.transactionHash)}
                  target="_blank"
                >
                  <SecondaryButton>onchain receipt</SecondaryButton>
                </Link>
              )}
            <Link
              href={'https://t.me/colinnielsen'}
              target="_blank"
              className="w-full"
            >
              <CTAButton>get help</CTAButton>
            </Link>
          </div>
        </DrawerFooter>
      </div>
    </DrawerContent>
  );
};
