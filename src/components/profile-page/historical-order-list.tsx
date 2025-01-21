import { Divider } from '@/components/ui/divider';
import { Drawer } from '@/components/ui/drawer';
import { Headline } from '@/components/ui/typography';
import { UUID } from '@/data-model/_common/type/CommonType';
import { Shop } from '@/data-model/shop/ShopType';
import { axiosFetcher } from '@/lib/utils';
import { useOrders, useRecentOrder } from '@/queries/OrderQuery';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { OrderDetail } from '../order/order-detail';
import { OrderSummary, SkeletonOrderSummary } from '../order/order-summary';

export const HistoricalOrderList = () => {
  const client = useQueryClient();
  const { data: orders } = useOrders();
  const { data: cart } = useRecentOrder();
  const shopQueries = useQueries({
    queries: [...new Set((orders ?? []).map(order => order.shop))].map(
      shopId => ({
        queryKey: ['shop', shopId],
        queryFn: () => axiosFetcher<Shop>(`/api/shops/${shopId}`),
        initialData:
          client
            .getQueryData<Shop[]>(['shop'])
            ?.find(shop => shop.id === shopId) ??
          client.getQueryData<Shop>(['shop', shopId]),
      }),
    ),
  });

  const [selectedOrderId, setSelectedOrder] = useState<UUID | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (open: boolean, orderId: UUID | null) => {
    if (open && orderId) {
      setSelectedOrder(orderId);
      setOpen(open);
    } else {
      setOpen(open);
      setTimeout(() => {
        setSelectedOrder(null);
      }, 200);
    }
  };

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
      shopLabel: shopQueries.find(query => query.data.id === order?.shop)!.data
        .label,
    };
  }, [orders, selectedOrderId, shopQueries]);

  if (!orders?.length) return null;
  return (
    <>
      <Divider />
      <div className="px-6 py-4 flex flex-col gap-4">
        {/* {cart && shopQueries.find(s => s.data?.id === cart.shop)?.data ? (
          <>
            <Headline>Current Order</Headline>
            <OrderSummary
              order={cart}
              shop={shopQueries.find(s => s.data?.id === cart.shop)?.data!}
              onSelect={() => setOpen(true)}
            />
          </>
        ) : (
          <></>
        )} */}
        {orders.length > 0 && (
          <>
            <Headline>Order history</Headline>
            <Drawer
              onOpenChange={o => o === false && handleOpenChange(o, null)}
              open={open}
              // dismissible={false}
            >
              <div className="flex flex-col gap-4">
                {orders && shopQueries.every(query => query.isSuccess)
                  ? orders.map((order, i) => {
                      const shop = shopQueries.find(
                        s => s.data.id === order.shop,
                      )?.data;

                      if (order.id === cart?.id) return <></>;
                      if (!shop || !order)
                        return <SkeletonOrderSummary key={i} />;
                      return (
                        <OrderSummary
                          key={order.id + i}
                          order={order}
                          shopLabel={shop.label}
                          shopLogo={shop.logo}
                          onClick={() => handleOpenChange(true, order.id)}
                        />
                      );
                    })
                  : Array.from({ length: 2 }, (_, i) => (
                      <SkeletonOrderSummary key={i} />
                    ))}
              </div>
              <OrderDetail
                order={selectedOrderData}
                shopLabel={selectedOrderData?.shopLabel ?? ''}
                onClose={() => handleOpenChange(false, null)}
              />
            </Drawer>
          </>
        )}
      </div>
    </>
  );
};
