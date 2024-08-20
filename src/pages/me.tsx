import { OrderItemDisplay } from '@/components/cart/basket/cart-item';
import { FarmerCard } from '@/components/cart/basket/farmer-card';
import { OrderSummary } from '@/components/cart/basket/summary';
import { Button, CTAButton, SecondaryButton } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  useCartDrawer,
} from '@/components/ui/drawer';
import { AnimatedTimer } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Body,
  Headline,
  Label2,
  Mono,
  Title1,
  Title2,
} from '@/components/ui/typography';
import {
  collapseDuplicateItems,
  getOrderItemCost,
  getOrderNumber,
  getOrderSummary,
  isPaidOrder,
  mapStatusToStatusLabel,
} from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { basescanTxUrl } from '@/lib/ethereum';
import { useLoginOrCreateUser } from '@/lib/hooks/login';
import { axiosFetcher, cn } from '@/lib/utils';
import {
  ORDERS_QUERY_KEY,
  useOrders,
  useRecentCart,
} from '@/queries/OrderQuery';
import {
  ACTIVE_USER_QUERY_KEY,
  useResetUser,
  useUser,
  useUserName,
} from '@/queries/UserQuery';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import Avatar from 'boring-avatars';
import { UUID } from 'crypto';
import { format } from 'date-fns';
import { ArrowLeft, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { isHex } from 'viem';
import { Prettify } from 'viem/chains';

const SkeletonLineItem = () => {
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

type OrderWithShop = Prettify<
  Order & {
    shopData: Shop;
  }
>;

const OrderLineItem = ({
  order,
  shop,
  onSelect,
}: {
  order: Order;
  shop: Shop;
  onSelect: (order: UUID) => void;
}) => {
  const orderSummary = useMemo(() => getOrderSummary(order), [order]);
  return (
    <div
      key={order.id}
      className="flex w-full min-h-[82px] gap-6 items-start justify-evenly h-auto transition-all duration-300"
    >
      <div className="overflow-hidden h-20 min-w-20 relative border border-light-gray rounded-full">
        <Image
          src={shop.logo}
          alt={shop.label}
          quality={20}
          fill={true}
          className="object-contain"
        />
      </div>

      <div className="flex flex-col gap-1 whitespace-nowrap">
        <Headline>{shop.label}</Headline>
        {isPaidOrder(order) && order.externalOrderInfo?.orderNumber ? (
          <Label2>Order #{order.externalOrderInfo.orderNumber}</Label2>
        ) : null}
        <Label2>{order.orderItems.length} items</Label2>
        <Label2>${orderSummary.total.formatted}</Label2>
        {order.status !== '4-complete' && (
          <Label2 className="flex items-center">
            {mapStatusToStatusLabel(order.status)}
            <AnimatedTimer height={14} className="inline stroke-primary-gray" />
          </Label2>
        )}
      </div>

      <Button
        onClick={() => onSelect(order.id)}
        className="px-4 py-2.5 uppercase rounded-[50px] bg-secondary-pop"
      >
        <Mono className="text-[14px]">view</Mono>
      </Button>
    </div>
  );
};

const OrderDetail = ({ order }: { order: OrderWithShop | null }) => {
  const orderSummary = useMemo(
    () => (order ? getOrderSummary(order) : null),
    [order],
  );
  return (
    <DrawerContent className="">
      <div className="flex flex-col h-screen overflow-scroll">
        <DrawerHeader className="h-14 flex items-center justify-evenly py-4 px-6">
          <div className="w-full">
            <DrawerClose asChild>
              <ArrowLeft height={24} width={24} strokeWidth={2.4} />
            </DrawerClose>
          </div>
          <DrawerTitle asChild>
            <Headline className="text-palette-foreground px-6 whitespace-nowrap w-full text-[16px] leading-[19.4px] font-libreFranklin font-semibold">
              {order && getOrderNumber(order)
                ? `Order #${getOrderNumber(order)}`
                : 'Your Cart'}
            </Headline>
          </DrawerTitle>
          <div className="w-full" />
        </DrawerHeader>
        <div className="flex flex-col py-2 gap-2">
          <Title1 className="text-palette-foreground px-6">
            {order?.shopData.label}
          </Title1>
          <div className="flex gap-2 px-6">
            <Label2
              className={cn({
                'text-secondary-pop': order?.status === '4-complete',
                'text-yellow-600': order?.status === '1-pending',
                'text-red-700': order?.status === 'cancelled',
              })}
            >
              Order{' '}
              {order?.status && mapStatusToStatusLabel(order?.status, 'past')}
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
        </div>
        <div className="flex flex-col w-full py-2 divide-y divide-light-gray">
          {order?.orderItems &&
            collapseDuplicateItems(order.orderItems).map(
              ([orderItem, quantity], index) => {
                const { price, discountPrice } = getOrderItemCost(orderItem);
                return (
                  <div key={index} className="py-6 w-full first:pt-0 last:pb-0">
                    <OrderItemDisplay
                      orderItem={orderItem}
                      originalPrice={price}
                      actualPrice={orderItem.paidPrice ?? discountPrice}
                      rightSide={
                        <div
                          className={
                            'flex items-center gap-2 px-4 py-2 font-normal text-sm bg-light-gray rounded-2xl justify-between'
                          }
                        >
                          <div className="flex items-center justify-center grow">
                            <Label2 className="text-black">{quantity}</Label2>
                          </div>
                        </div>
                      }
                    />
                  </div>
                );
              },
            )}
          {order && (
            <OrderSummary
              summary={orderSummary}
              isLoading={!orderSummary}
              hideTipIfZero
            />
          )}
          {order && (
            <div className="px-6 py-6">
              <FarmerCard
                {...{
                  order: order,
                  showPics: false,
                  // className: !isPaying ? 'opacity-0' : 'opacity-1',
                }}
              />
            </div>
          )}
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

const HistoricalOrderList = () => {
  const client = useQueryClient();
  const { data: orders } = useOrders();
  const { data: cart } = useRecentCart();
  const { setOpen } = useCartDrawer();

  const [selectedOrderId, setSelectedOrder] = useState<UUID | null>(null);

  const shopQueries = useQueries({
    queries: (orders ?? []).map(order => ({
      queryKey: ['shop', order.shop],
      queryFn: () => axiosFetcher<Shop>(`/api/shops/${order.shop}`),
      initialData:
        client
          .getQueryData<Shop[]>(['shop'])
          ?.find(shop => shop.id === order.shop) ??
        client.getQueryData<Shop>(['shop', order.shop]),
    })),
  });

  const selectedOrderData = useMemo(() => {
    if (
      !orders ||
      !selectedOrderId ||
      !shopQueries?.every(query => query.isSuccess)
    )
      return null;

    const order = orders.find(order => order.id === selectedOrderId);
    return {
      ...order!,
      shopData: shopQueries.find(query => query.data.id === order?.shop)!.data,
    } satisfies OrderWithShop;
  }, [orders, selectedOrderId, shopQueries]);
  if (!orders?.length) return null;

  return (
    <>
      <Divider />
      <div className="px-6 py-4 flex flex-col gap-4">
        {cart && shopQueries.find(s => s.data?.id === cart.shop)?.data ? (
          <>
            <Headline>Current Order</Headline>
            <OrderLineItem
              order={cart}
              shop={shopQueries.find(s => s.data?.id === cart.shop)?.data!}
              onSelect={() => setOpen(true)}
            />
            <Divider />
          </>
        ) : (
          <></>
        )}
        <Headline>Order history</Headline>
        <Drawer
          onOpenChange={open => !open && setSelectedOrder(null)}
          open={!!selectedOrderId}
          dismissible={false}
        >
          <div className="flex flex-col gap-4">
            {orders && shopQueries.every(query => query.isSuccess)
              ? shopQueries.map((query, i) => {
                  const shop = query.data;
                  const order = orders[i];

                  if (order.id === cart?.id) return <></>;
                  if (!shop || !order) return <SkeletonLineItem key={i} />;
                  return (
                    <OrderLineItem
                      key={order.id}
                      order={order}
                      shop={shop}
                      onSelect={setSelectedOrder}
                    />
                  );
                })
              : Array.from({ length: 2 }, (_, i) => (
                  <SkeletonLineItem key={i} />
                ))}
          </div>
          <OrderDetail order={selectedOrderData} />
        </Drawer>
      </div>
    </>
  );
};

const Me = () => {
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  const { mutate: reset } = useResetUser();
  const login = useLoginOrCreateUser({
    onLogin: data => {
      queryClient.setQueryData([ACTIVE_USER_QUERY_KEY], data);
      queryClient.refetchQueries({
        queryKey: [ORDERS_QUERY_KEY, data.id],
      });
    },
  });

  const { data: name, isLoading: nameLoading } = useUserName(user);
  return (
    <PageWrapper>
      <PageHeader title="Profile" />
      <div className="flex justify-between items-center px-6">
        <div className="flex flex-col">
          {nameLoading ? (
            <Skeleton>
              <Title2 className="text-2xl font-bold invisible w-10">
                loading
              </Title2>
            </Skeleton>
          ) : (
            <Title2 className="text-2xl font-bold">{name}</Title2>
          )}

          {user?.createdAt ? (
            <Body className="text-primary-gray">
              {user.__type === 'session'
                ? 'Welcome! ✌️✨'
                : `Joined since ${new Date(user?.createdAt).toLocaleDateString()}`}
            </Body>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        {!user?.id ? (
          <Skeleton className="h-20 w-20 rounded-full" />
        ) : (
          <button onClick={() => login()}>
            <Avatar
              variant="beam"
              name={user?.wallet?.address || user?.id}
              size={80}
            />
          </button>
        )}
      </div>

      <div className="h-4" />

      <HistoricalOrderList />

      <Divider />

      {user?.wallet && (
        <>
          <div className="px-6 py-4 flex flex-col gap-4">
            <Headline>Connected Address</Headline>
            <Body>
              {user.wallet?.address.slice(0, 6)}...
              {user.wallet?.address.slice(-4)}
            </Body>
          </div>
          <Divider />
        </>
      )}

      <div className="px-6 py-4 flex justify-between items-center">
        <Headline>
          {user?.__type === 'user' ? 'Sign out and r' : 'R'}eset
        </Headline>
        <button onClick={() => reset()}>
          <LogOut height={20} width={20} />
        </button>
      </div>
    </PageWrapper>
  );
};

export default Me;
