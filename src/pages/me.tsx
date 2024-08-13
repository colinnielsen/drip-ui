import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { AnimatedTimer } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Body,
  Headline,
  Label2,
  Mono,
  Title2,
} from '@/components/ui/typography';
import {
  getOrderSummary,
  isPaidOrder,
  mapStatusToStatusLabel,
} from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useLoginOrCreateUser } from '@/lib/hooks/login';
import { ORDERS_QUERY_KEY, useOrders } from '@/queries/OrderQuery';
import { useShops } from '@/queries/ShopQuery';
import {
  ACTIVE_USER_QUERY_KEY,
  useResetUser,
  useUser,
} from '@/queries/UserQuery';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Avatar from 'boring-avatars';
import { LogOut } from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';
import { createClient, http } from 'viem';
import { getEnsName } from 'viem/actions';
import { mainnet } from 'viem/chains';

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

const OrderLineItem = ({ order, shop }: { order: Order; shop: Shop }) => {
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
        {order.status !== 'complete' && (
          <Label2 className="flex items-center">
            {mapStatusToStatusLabel(order.status)}
            <AnimatedTimer height={14} className="inline stroke-primary-gray" />
          </Label2>
        )}
      </div>

      {/* <DrawerTrigger asChild> */}
      <Button className="px-4 py-2.5 uppercase rounded-[50px] bg-secondary-pop">
        <Mono className="text-[14px]">view</Mono>
      </Button>
      {/* </DrawerTrigger> */}
    </div>
  );
};

const Me = () => {
  const { data: user } = useUser();
  const { data: orders } = useOrders();
  const { data: shops } = useShops();
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

  const { data: name, isLoading: nameLoading } = useQuery({
    queryKey: ['user', 'username'],
    queryFn: () =>
      user?.__type === 'user'
        ? getEnsName(createClient({ chain: mainnet, transport: http() }), {
            address: user?.wallet?.address!,
          }).then(n => (!n ? 'You' : n))
        : Promise.resolve('Guest'),
  });
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

      {orders?.length ? (
        <>
          <Divider />
          <div className="px-6 py-4 flex flex-col gap-4">
            <Headline>Order history</Headline>
            <div className="flex flex-col gap-4">
              {shops && orders
                ? orders?.map(order => {
                    const shop = shops?.find(shop => shop.id === order.shop);
                    if (!shop)
                      return (
                        <div className="text-red-500 px-6" key={order.id}>
                          Shop not found
                        </div>
                      );
                    return (
                      <OrderLineItem key={order.id} order={order} shop={shop} />
                    );
                  })
                : Array.from({ length: 2 }, (_, i) => (
                    <SkeletonLineItem key={i} />
                  ))}
            </div>
          </div>
        </>
      ) : null}

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
