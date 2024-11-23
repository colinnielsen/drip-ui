import { CTAButton } from '@/components/ui/button';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Body, Title2 } from '@/components/ui/typography';
import { isDecryptedSquareConnection } from '@/data-model/square-connection/SquareConnectionDTO';
import { SquareConnection } from '@/data-model/square-connection/SquareConnectionType';
import { Spinner } from '@phosphor-icons/react/dist/ssr';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { SQUARE_AUTHORIZATION_ERRORS } from './api/square/square-callback';

const getSquareConnectionStatus = async () => {
  const response = await axios
    .get<SquareConnection>('/api/square/square-connection')
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

const ConnectedState = ({ merchantId }: { merchantId: string }) => {
  return (
    <>
      <Title2>Square Account Connected ✅</Title2>
      <Body>merchantId: {merchantId}</Body>
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <AuthorizationResponses />
        {state === 'not-connected' ? (
          <ConnectPrompt />
        ) : state === 'loading' ? (
          <Spinner className="animate-spin" />
        ) : isDecryptedSquareConnection(state) ? (
          <ConnectedState {...state} />
        ) : null}
      </div>
    </PageWrapper>
  );
}
