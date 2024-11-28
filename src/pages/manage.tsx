import { CTAButton } from '@/components/ui/button';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Body, Title1, Title2 } from '@/components/ui/typography';
import { StoreConfig } from '@/data-model/shop/ShopType';
import { isDecryptedSquareConnection } from '@/data-model/square-connection/SquareConnectionDTO';
import { SquareConnection } from '@/data-model/square-connection/SquareConnectionType';
import { SQUARE_AUTHORIZATION_ERRORS } from '@/lib/squareClient';
import { Spinner } from '@phosphor-icons/react/dist/ssr';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { UUID } from 'crypto';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';

const getSquareConnectionStatus = async () => {
  const response = await axios
    .get<{
      connection: SquareConnection;
      squareStoreConfig: StoreConfig;
    }>('/api/square/square-connection')
    .catch((e: AxiosError) =>
      e.response?.status === 404 ? { data: null } : Promise.reject(e),
    );

  return response.data;
};

const useSquareConnectionStatus = () =>
  useQuery({
    queryKey: ['square-connection-status'],
    queryFn: () => getSquareConnectionStatus(),
  });

const AuthorizationResponses = () => {
  const searchParams = useSearchParams();
  const error = z
    .enum(SQUARE_AUTHORIZATION_ERRORS)
    .safeParse(searchParams.get('error'));

  if (!error.success) return null;

  const message = searchParams.get('message');

  return (
    <div className="flex flex-col gap-2">
      <Title2>{error.data}</Title2>
      <Body>{message}</Body>
    </div>
  );
};

const syncStore = async (merchantId: string) =>
  await axios
    .post<{ shopId: UUID }>('/api/shops/sync', { merchantId })
    .then(res => res.data.shopId);

const ConnectedState = ({
  connection,
  squareStoreConfig,
}: {
  connection: SquareConnection;
  squareStoreConfig: StoreConfig;
}) => {
  const mutation = useMutation({
    mutationFn: () => syncStore(connection.merchantId),
  });

  const visitShop = () => {
    window.open(`/shops/${mutation.data}`, '_blank');
  };

  return (
    <>
      <Title2>Square Account Connected ✅</Title2>
      <Body>merchantId: {connection.merchantId}</Body>
      <Title1>{squareStoreConfig.name}</Title1>
      {squareStoreConfig.logo && (
        <img
          src={squareStoreConfig.logo}
          alt={squareStoreConfig.name ?? 'Square Store Logo'}
          width={100}
          height={100}
        />
      )}
      <div className="flex justify-center gap-2 flex-col">
        <CTAButton
          className="w-40"
          onClick={() => mutation.mutate()}
          isLoading={mutation.isPending}
        >
          Sync
        </CTAButton>
        {mutation.isSuccess && (
          <div className="flex flex-col items-center justify-center">
            <Body>Sync completed ✅</Body>
            <CTAButton onClick={visitShop}>Visit Shop</CTAButton>
          </div>
        )}
        {mutation.error && (
          <Body className="text-red-500">{mutation.error.message}</Body>
        )}
      </div>
    </>
  );
};

const ConnectPrompt = () => {
  return (
    <>
      <Title2>Connect Your Square Account</Title2>
      <Link href="/api/square/square-authorization-redirect">
        <CTAButton>Login</CTAButton>
      </Link>
    </>
  );
};

export default function SellerPage() {
  const query = useSquareConnectionStatus();

  const state = query.data
    ? query.data
    : query.data === null
      ? 'not-connected'
      : 'loading';

  return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <AuthorizationResponses />
        {state === 'not-connected' ? (
          <ConnectPrompt />
        ) : state === 'loading' ? (
          <Spinner className="animate-spin" />
        ) : isDecryptedSquareConnection(state.connection) ? (
          <ConnectedState {...state} />
        ) : null}
      </div>
    </PageWrapper>
  );
}
