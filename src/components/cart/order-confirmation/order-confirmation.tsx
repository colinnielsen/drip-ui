import dripLogo from '@/assets/drip.jpg';
import orderComplete from '@/assets/order-complete-2.png';
import { CTAButton } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Divider } from '@/components/ui/divider';
import {
  DrawerClose,
  DrawerTitle,
  useCartDrawer,
} from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Drip, Headline, Label2 } from '@/components/ui/typography';
import { Order } from '@/data-model/order/OrderType';
import { isStorefront } from '@/data-model/shop/ShopDTO';
import { Shop } from '@/data-model/shop/ShopType';
import { useRecentOrder } from '@/queries/OrderQuery';
import { useShop } from '@/queries/ShopQuery';
import { CarSimple } from '@phosphor-icons/react/dist/ssr';
import { Link, Newspaper, Timer, X } from 'lucide-react';
import Image from 'next/image';
import { Fragment } from 'react';
import { OrderItemDisplay } from '../basket/cart-item';
import { PurchaseSummary } from '../basket/summary';
import { AsCheckoutSlide } from '../checkout-slides';

export const OrderConfirmation = ({
  order,
  shop,
}: {
  order?: Order | null;
  shop?: Shop | null;
}) => {
  const { setOpen } = useCartDrawer();
  // const farmer = useFarmerAllocationFromOrder(order);
  // const summary = getSummariesFromOrderOrCart(order);

  const closeButton = (
    <div className="flex justify-start w-full items-center px-6 py-4">
      <DrawerClose asChild>
        <button onClick={() => setOpen(false)}>
          <X height={24} width={24} />
        </button>
      </DrawerClose>
    </div>
  );

  return (
    <>
      {closeButton}
      <div className="h-full bg-background flex flex-col items-center gap-6 w-full pb-32">
        <div className="flex flex-col items-center justify-center gap-6 px-6">
          <div className="flex items-center justify-center h-[280px] w-[280px] overflow-clip">
            {order?.status === 'error' ? (
              <Image
                src={dripLogo}
                alt="order error!"
                width={280}
                className="rotate-270"
              />
            ) : (
              <Image src={orderComplete} alt="order complete" width={280} />
            )}
          </div>
          <DrawerTitle>
            <Drip
              className="text-2xl text-center py-2"
              as={!order ? Skeleton : 'div'}
            >
              {!order
                ? 'loading...'
                : +order.status.at(0)! < 3
                  ? 'nice! order confirmed'
                  : order.status === '3-complete'
                    ? 'ready for pickup!'
                    : order.status === 'error'
                      ? 'order error!'
                      : ''}
            </Drip>
            {order?.externalOrderInfo?.status === '3-complete' ? (
              <Drip className="text-xl text-center py-2" as="div">
                enjoy that sweet, sweet brew
              </Drip>
            ) : (
              order?.status === 'error' && (
                <div className="flex flex-col gap-2">
                  <Drip className="text-xl text-center py-2" as="div">
                    order error!
                  </Drip>
                  <Link
                    href={'https://t.me/colinnielsen'}
                    target="_blank"
                    className="w-full"
                  >
                    <CTAButton>get help</CTAButton>
                  </Link>
                </div>
              )
            )}
          </DrawerTitle>
          <DrawerClose asChild>
            {/* <Link href={`/farmer/${farmer?.farmer.id}`}>
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
                  <div className="flex flex-col gap-2 py-4 text-left">
                    <Title2>Thank you</Title2>
                    <Label1 className="text-primary-gray">
                      {farmer?.farmer.name} just received{' '}
                      <span>
                        $
                        {(
                          (+(summary?.subTotal.formatted ?? '0') *
                            (farmer?.allocation.allocationBPS ?? 0)) /
                          10000
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>{' '}
                      from your purchase
                    </Label1>

                    <Label2 className="underline">
                      Learn more about {farmer?.farmer.name.split(' ')[0]}
                    </Label2>
                  </div>
                }
              />
            </Link> */}
          </DrawerClose>
        </div>

        <Divider />

        <div className="flex flex-col w-full gap-2.5 px-6 items-start">
          <Headline>Pick up details</Headline>
          <div className="flex  items-center justify-center gap-2">
            <Newspaper className="w-4 h-4" />
            <Label2 className="text flex gap-x-1 items-center text-palette-foreground font-semibold text-md underline">
              Order number:
              <span>
                {order?.externalOrderInfo?.orderNumber ? (
                  `#${order.externalOrderInfo.orderNumber}`
                ) : (
                  <Skeleton className="w-7 h-4" />
                )}
              </span>
            </Label2>
          </div>
          {order?.status !== '3-complete' && (
            <div className="flex  items-center justify-center gap-2">
              <Timer className="w-4 h-4" />
              <Label2 className="text-primary-gray">
                Estimated time: 5 minutes
              </Label2>
            </div>
          )}
          <div className="flex flex-row gap-2 w-full  overflow-clip">
            <div className="rounded-full border-light-gray overflow-clip min-w-20 min-h-20">
              {shop ? (
                <Image
                  src={shop?.logo}
                  alt="logo"
                  width={80}
                  height={80}
                  quality={20}
                />
              ) : (
                <Skeleton className="w-20 h-20" />
              )}
            </div>
            <div className="flex flex-col gap-2 p-1.5 ">
              <Headline>{shop?.label}</Headline>

              {shop && isStorefront(shop) && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-2">
                    <CarSimple weight="bold" height={16} width={16} />
                    <Label2 className="whitespace-nowrap text-ellipsis">
                      {shop.location?.address}
                    </Label2>
                  </div>
                  {/* <Label2>0.7 mi</Label2> */}
                </div>
              )}
            </div>
          </div>
        </div>

        <Divider />

        <div className="flex flex-col w-full gap-3.5 items-start">
          <Headline className="px-6">Order summary</Headline>
          <div className="flex flex-col gap-6 w-full">
            {order?.lineItems.map((li, index) => {
              return (
                <Fragment key={index}>
                  <OrderItemDisplay
                    lineItem={li}
                    rightSide={
                      <div
                        className={
                          'flex items-center gap-2 px-4 py-2 font-normal text-sm bg-light-gray rounded-2xl justify-between'
                        }
                      >
                        <div className="flex items-center justify-center grow">
                          <Label2 className="text-black">{li.quantity}</Label2>
                        </div>
                      </div>
                    }
                  />
                  <Divider />
                </Fragment>
              );
            })}
          </div>
        </div>

        <PurchaseSummary order={order || undefined} isLoading={!order} />

        <DialogFooter className="w-full px-6 pb-8">
          <DialogClose asChild>
            <CTAButton onClick={() => setOpen(false)}>Close</CTAButton>
          </DialogClose>
        </DialogFooter>
      </div>
    </>
  );
};

export function ConfirmationSlide() {
  const { data: order } = useRecentOrder();
  const { data: shop } = useShop({ id: order?.shop });

  return (
    <AsCheckoutSlide>
      <OrderConfirmation order={order} shop={shop} />
    </AsCheckoutSlide>
  );
}
