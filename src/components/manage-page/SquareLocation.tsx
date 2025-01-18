import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { SecondaryButton } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusSvg } from '@/components/ui/icons';
import { Body } from '@/components/ui/typography';
import { QueriedSquareLocation } from '@/data-model/_external/data-sources/square/SquareType';
import {
  mapEthAddressToAddress,
  mapToEthAddress,
} from '@/data-model/ethereum/EthereumDTO';
import { ChainId, EthAddress } from '@/data-model/ethereum/EthereumType';
import { MinSquareConnection } from '@/data-model/square-connection/SquareConnectionType';
import { UUID } from '@/data-model/_common/type/CommonType';
import { SquareShopConfig } from '@/data-model/shop/ShopType';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { isAddress } from 'viem';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import axios from 'axios';
import { ShopConfigRequest } from '@/pages/api/shops/shop-config';
import { getSqaureExternalId } from '@/data-model/shop/ShopDTO';
import { cn } from '@/lib/utils';
import { useErrorToast } from '@/lib/hooks/use-toast';

const syncSquareLocation = async (merchantId: string, locationId: string) =>
  await axios
    .post<{ shopId: UUID }>('/api/shops/sync?type=square', {
      externalId: getSqaureExternalId({ merchantId, locationId }),
    })
    .then(res => res.data.shopId);

const updateShopConfig = async (
  action: 'add' | 'update',
  merchantId: string,
  locationId: string,
  fundRecipient?: EthAddress,
  tipRecipient?: EthAddress,
) =>
  await axios
    .post<SquareShopConfig>('/api/shops/shop-config', {
      action,
      type: 'square',
      locationId,
      merchantId,
      fundRecipient,
      tipRecipient,
    } satisfies ShopConfigRequest)
    .then(res => res.data);

const SquareLocation: React.FC<{
  location: QueriedSquareLocation;
  connection: MinSquareConnection;
  shopConfig: SquareShopConfig | 'not-added';
}> = ({ location, connection, shopConfig }) => {
  const isAdded = shopConfig !== 'not-added';
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [fundRecipient, setFundRecipient] = useState<EthAddress | null>(
    isAdded ? (shopConfig.fundRecipientConfig?.recipient ?? null) : null,
  );
  const [tipRecipient, setTipRecipient] = useState<EthAddress | null>(
    isAdded ? (shopConfig.tipConfig?.recipient ?? null) : null,
  );
  const errorToast = useErrorToast();

  const updateConfigMutation = useMutation({
    mutationFn: ({ action }: { action: 'add' | 'update' }) =>
      updateShopConfig(
        action,
        connection.merchantId,
        location.id,
        fundRecipient ?? undefined,
        tipRecipient ?? undefined,
      ).then(() => syncSquareLocation(connection.merchantId, location.id)),
    onMutate: () => setSyncing(true),
    onSuccess: () => {
      setSyncing(false);
      queryClient.invalidateQueries({ queryKey: ['square-connection-status'] });
    },
    onError: e => {
      errorToast(e);
      setSyncing(false);
    },
  });

  const handleAddressChange =
    (setter: React.Dispatch<React.SetStateAction<EthAddress | null>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const address = e.target.value;
      if (isAddress(address)) setter(mapToEthAddress(ChainId.BASE, address));
    };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Avatar>
            <AvatarImage src={location.logoUrl} />
          </Avatar>

          <div className="w-46">
            <SecondaryButton
              variant="secondary-small"
              className={cn(
                'flex gap-2 items-center',
                location.added ? 'bg-blue-600 text-white' : '',
              )}
              isLoading={syncing}
              onClick={() =>
                updateConfigMutation.mutate({
                  action: location.added ? 'update' : 'add',
                })
              }
            >
              {location.added ? 'Update' : 'Connect'}
              {!location.added && (
                <div className="bg-white rounded-full flex justify-center items-center w-7 h-7 active:bg-neutral-200 drop-shadow-md">
                  <PlusSvg />
                </div>
              )}
            </SecondaryButton>
          </div>
        </div>
        <CardTitle>
          {location.name}
          <div className="w-full" />
        </CardTitle>
        <CardDescription>
          {location.type === 'PHYSICAL' ? (
            <>
              {location.address?.addressLine1} {location.address?.addressLine2}
              <br />
              {location.address?.locality}{' '}
              {location.address?.administrativeDistrictLevel1}
            </>
          ) : (
            'Mobile'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Body className="capitalize">
          <b>Type</b>: {location.type.toLowerCase()}
          <br />
          <b>Status in Square</b>: {location.status.toLowerCase()}{' '}
          {location.status === 'ACTIVE' ? '💛' : '😴'}
          <br />
          <br />
          <Label htmlFor={`fund-recipient-${location.id}`}>
            Fund Recipient
          </Label>
          <Input
            id={`fund-recipient-${location.id}`}
            type="text"
            value={fundRecipient ? mapEthAddressToAddress(fundRecipient) : ''}
            placeholder="Fund Recipient"
            onChange={handleAddressChange(setFundRecipient)}
            disabled={!isAdded}
          />
          <br />
          <Label htmlFor={`tip-recipient-${location.id}`}>Tip Recipient</Label>
          <Input
            id={`tip-recipient-${location.id}`}
            type="text"
            value={tipRecipient ? mapEthAddressToAddress(tipRecipient) : ''}
            placeholder="Tip Recipient"
            onChange={handleAddressChange(setTipRecipient)}
            disabled={!isAdded}
          />
        </Body>
      </CardContent>
    </Card>
  );
};

export default SquareLocation;
