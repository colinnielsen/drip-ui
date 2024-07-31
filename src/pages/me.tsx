import { Divider } from '@/components/ui/divider';
import { PageHeader } from '@/components/ui/page-header';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Body, Headline, Title2 } from '@/components/ui/typography';
import { Order } from '@/data-model/order/OrderType';
import { Shop } from '@/data-model/shop/ShopType';
import { useOrders } from '@/queries/OrderQuery';
import { useShops } from '@/queries/ShopQuery';
import { useUser } from '@/queries/UserQuery';
import Avatar from 'boring-avatars';

const OrderLineItem = ({ order, shop }: { order: Order; shop: Shop }) => {
  return (
    <div key={order.id} className="flex w-full px-6 h-[82px]">
      {order.id}
    </div>
  );
};

const Me = () => {
  const { data: user } = useUser();
  const { data: orders } = useOrders();
  const { data: shops } = useShops();

  return (
    <PageWrapper>
      <PageHeader title="Profile" />
      <div className="flex justify-between items-center px-6">
        <div className="flex flex-col">
          <Title2 className="text-2xl font-bold">You</Title2>

          {user?.createdAt ? (
            <Body className="text-primary-gray">
              Joined since {new Date(user?.createdAt).toLocaleDateString()}
            </Body>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        {!user?.id ? (
          <Skeleton className="h-20 w-20 rounded-full" />
        ) : (
          <Avatar name={user?.id} size={80} />
        )}
      </div>
      <div className="h-4" />
      <Divider />
      <div className="h-4" />
      <div className="px-6 py-4">
        <Headline>Order history</Headline>
        <div className="flex gap-4">
          {orders?.map(order => {
            const shop = shops?.find(shop => shop.id === order.shop);
            if (!shop)
              return <div className="text-red-500 px-6">Shop not found</div>;
            return <OrderLineItem key={order.id} order={order} shop={shop} />;
          })}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Me;
