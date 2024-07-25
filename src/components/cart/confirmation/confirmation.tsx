import orderComplete from '@/assets/order-complete-2.png';
import { Divider } from '@/components/ui/divider';
import { InfoCard } from '@/components/ui/info-card';
import {
  Drip,
  Headline,
  Label1,
  Label2,
  Title2,
} from '@/components/ui/typography';
import { getOrderSummary, isPaidOrder } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useFarmerAllocationFromOrder } from '@/queries/OrderQuery';
import { Newspaper, Timer } from 'lucide-react';
import Image from 'next/image';
import { AsCheckoutSlide } from '../checkout-slides';

export function ConfirmationSlide({ cart, shop }: { cart: Order; shop: Shop }) {
  const farmer = useFarmerAllocationFromOrder(cart);
  const summary = getOrderSummary(cart);

  return (
    <AsCheckoutSlide>
      {isPaidOrder(cart) && (
        <div className="h-full bg-background flex flex-col items-center justify-center gap-4 py-6 w-full">
          <div className="flex flex-col items-center justify-center gap-6 px-6 ">
            <div className="flex items-center justify-center h-[280px] w-[280px] overflow-clip">
              <Image src={orderComplete} alt="loading bar" width={280} />
            </div>
            <Drip className="text-2xl text-center">nice! order confirmed</Drip>
            <InfoCard
              className="h-32"
              left={
                farmer && (
                  <Image
                    src={farmer.farmer.image}
                    alt={'farmer-image'}
                    fill
                    className="object-cover"
                  />
                )
              }
              info={
                <div className="flex flex-col gap-2 py-4">
                  <Title2>Thank you</Title2>
                  <Label1 className="text-primary-gray">
                    {farmer?.farmer.name} just received{' '}
                    <span>
                      $
                      {(
                        (+summary.total.formatted *
                          (farmer?.allocation.allocationBPS ?? 0)) /
                        10000
                      ).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>{' '}
                    from your purchase
                  </Label1>
                  <Label2>Learn more about {farmer?.farmer.name}</Label2>
                </div>
              }
            />
          </div>

          <Divider />

          <div className="flex flex-col w-full gap-3.5 p-6 items-start">
            <Headline>Pick up details</Headline>
            <div className="flex  items-center justify-center gap-2">
              <Newspaper className="w-4 h-4" />
              <Label2 className="text-primary-gray">Order number: #4</Label2>
            </div>
            <div className="flex  items-center justify-center gap-2">
              <Timer className="w-4 h-4" />
              <Label2 className="text-primary-gray">
                {summary.total.formatted}
              </Label2>
            </div>
          </div>
        </div>
      )}
    </AsCheckoutSlide>
  );
}
