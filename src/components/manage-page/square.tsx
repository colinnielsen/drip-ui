import { CTAButton } from '@/components/ui/button';
import { Body, Title1, Title2 } from '@/components/ui/typography';
import { UUID } from '@/data-model/_common/type/CommonType';
import { EthAddress } from '@/data-model/ethereum/EthereumType';
import { getSqaureExternalId } from '@/data-model/shop/ShopDTO';
import { SquareShopConfig } from '@/data-model/shop/ShopType';
import { SQUARE_AUTHORIZATION_ERRORS } from '@/lib/squareClient';
import { ShopConfigRequest } from '@/pages/api/shops/shop-config';
import { SquareConnectionResponse } from '@/pages/api/square/square-connection';
import { Spinner } from '@phosphor-icons/react/dist/ssr';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SquareLocation from './SquareLocation';

const getSquareConnectionStatus = async () => {
  const response = await axios
    .get<SquareConnectionResponse>('/api/square/square-connection')
    .catch((e: AxiosError) =>
      e.response?.status === 404 || e.response?.status === 401
        ? { data: null }
        : Promise.reject(e),
    );

  return response.data;
};

const useSquareConnectionStatus = () =>
  useQuery({
    queryKey: ['square-connection-status'],
    queryFn: getSquareConnectionStatus,
  });

const AuthorizationResponses = () => {
  const searchParams = useSearchParams();
  const error = JSON.parse(searchParams.get('error') || '');

  if (!error.success) return null;

  const message = searchParams.get('message');

  return (
    <div className="flex flex-col gap-2 text-red-500">
      <Title2>{error.data}</Title2>
      <Body>{message}</Body>
    </div>
  );
};

const syncSquareLocation = async (merchantId: string, locationId: string) =>
  await axios
    .post<{
      shopId: UUID;
    }>('/api/shops/sync?type=square', {
      externalId: getSqaureExternalId({ merchantId, locationId }),
    })
    .then(res => res.data.shopId);

const addSquareLocation = async (
  merchantId: string,
  locationId: string,
  fundRecipient?: EthAddress,
  tipRecipient?: EthAddress,
) =>
  await axios
    .post<SquareShopConfig>('/api/shops/shop-config', {
      action: 'add',
      type: 'square',
      locationId,
      merchantId,
      fundRecipient,
      tipRecipient,
    } satisfies ShopConfigRequest)
    .then(res => res.data);

const addFundRecipient = async (
  merchantId: string,
  locationId: string,
  address: EthAddress,
) =>
  await axios
    .post<SquareShopConfig>('/api/shops/shop-config', {
      action: 'add',
      type: 'square',
      locationId,
      merchantId,
      fundRecipient: address,
    } satisfies ShopConfigRequest)
    .then(res => res.data);

const ConnectedState = ({
  connection,
  squareShopConfigs,
  squareLocations,
}: SquareConnectionResponse) => {
  return (
    <>
      <div className="flex gap-2 items-center">
        <Title2 className="font-semibold">
          Welcome {connection.businessName}!
        </Title2>
      </div>

      <Link
        href="/api/square/square-authorization-redirect"
        replace
        className="underline"
      >
        Reauthorize
      </Link>
      <Body>
        <b>Merchant Id</b>: {connection.merchantId}
      </Body>

      <div className="flex flex-col gap-2 w-full pt-10">
        <Title1>Locations:</Title1>

        <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1 max-w-2xl ">
          {squareLocations.map(location => {
            const config = squareShopConfigs.find(
              config =>
                config.externalId ===
                getSqaureExternalId({
                  merchantId: connection.merchantId,
                  locationId: location.id,
                }),
            );

            return (
              <SquareLocation
                key={location.id}
                location={location}
                connection={connection}
                shopConfig={config ?? 'not-added'}
              />
            );
          })}
        </div>
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

export const SquareConnectionManager = () => {
  const query = useSquareConnectionStatus();

  const state = query.data
    ? query.data
    : query.data === null
      ? 'not-connected'
      : 'loading';
  return (
    <>
      <AuthorizationResponses />
      {state === 'not-connected' ? (
        <ConnectPrompt />
      ) : state === 'loading' ? (
        <Spinner className="animate-spin" />
      ) : (
        <ConnectedState {...state} />
      )}
    </>
  );
};
