import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { CTAButton, SecondaryButton } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusSvg } from '@/components/ui/icons';
import { Body, Title1, Title2 } from '@/components/ui/typography';
import {
  getLocationIdFromSquareExternalId,
  getSqaureExternalId,
} from '@/data-model/shop/ShopDTO';
import { StoreConfig } from '@/data-model/shop/ShopType';
import { SQUARE_AUTHORIZATION_ERRORS } from '@/lib/squareClient';
import { StoreConfigRequest } from '@/pages/api/shops/store-config';
import { SquareConnectionResponse } from '@/pages/api/square/square-connection';
import { Spinner } from '@phosphor-icons/react/dist/ssr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { UUID } from 'crypto';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

const getSquareConnectionStatus = async () => {
  const response = await axios
    .get<SquareConnectionResponse>('/api/square/square-connection')
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

const addSquareLocation = async (merchantId: string, locationId: string) =>
  await axios
    .post<StoreConfig>('/api/shops/store-config', {
      action: 'add',
      type: 'square',
      locationId,
      merchantId,
    } satisfies StoreConfigRequest)
    .then(res => res.data);

const ConnectedState = ({
  connection,
  squareStoreConfigs,
  squareLocations,
}: SquareConnectionResponse) => {
  const queryClient = useQueryClient();

  const [addingLocationId, setAddingLocationId] = useState<string | null>(null);
  const [syncingLocationId, setSyncingLocationId] = useState<string | null>(
    null,
  );

  const syncMutation = useMutation({
    mutationFn: ({ locationId }: { locationId: string }) =>
      syncSquareLocation(connection.merchantId, locationId),
    onMutate(variables) {
      setSyncingLocationId(variables.locationId);
    },
    onSuccess(shopId) {
      setSyncingLocationId(null);
    },
  });

  const addMutation = useMutation({
    mutationFn: ({ locationId }: { locationId: string }) =>
      addSquareLocation(connection.merchantId, locationId),
    onMutate(variables) {
      setAddingLocationId(variables.locationId);
    },
    onSuccess(nextConfig) {
      setAddingLocationId(null);
      queryClient.setQueryData(
        ['square-connection-status'],
        (prev: SquareConnectionResponse) => ({
          ...prev,
          squareLocations: prev.squareLocations.map(location => ({
            ...location,
            added:
              location.id ===
              getLocationIdFromSquareExternalId(nextConfig.externalId),
          })),
        }),
      );
      queryClient.invalidateQueries({
        queryKey: ['square-connection-status'],
      });
    },
  });

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
          {squareLocations.map(location => (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Avatar>
                    <AvatarImage src={location.logoUrl} />
                  </Avatar>
                  {location.added ? (
                    <div className="w-20">
                      <SecondaryButton
                        className="bg-blue-600 text-white"
                        variant="secondary-small"
                        isLoading={syncingLocationId === location.id}
                        onClick={() => {
                          syncMutation.mutateAsync({ locationId: location.id });
                        }}
                      >
                        sync
                      </SecondaryButton>
                    </div>
                  ) : (
                    <div className="w-46">
                      <SecondaryButton
                        variant="secondary-small"
                        className="flex gap-2 items-center"
                        isLoading={addingLocationId === location.id}
                        onClick={() =>
                          addMutation.mutateAsync({ locationId: location.id })
                        }
                      >
                        connect
                        <div className="bg-white rounded-full flex justify-center items-center w-7 h-7 active:bg-neutral-200 drop-shadow-md">
                          <PlusSvg />
                        </div>
                      </SecondaryButton>
                    </div>
                  )}
                </div>
                <CardTitle>
                  {location.name}
                  <div className="w-full" />
                </CardTitle>
                <CardDescription>
                  {location.type === 'PHYSICAL' ? (
                    <>
                      {location.address?.addressLine1}{' '}
                      {location.address?.addressLine2}
                      <br></br>
                      {location.address?.locality}{' '}
                      {location.address?.administrativeDistrictLevel1}
                    </>
                  ) : (
                    'Mobile'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Body>
                  <b>Type</b>: {location.type}
                  <br />
                  <b>Status in Square</b>: {location.status}
                </Body>
              </CardContent>
            </Card>
          ))}
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
