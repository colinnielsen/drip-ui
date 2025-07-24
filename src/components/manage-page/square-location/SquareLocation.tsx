import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { CTAButton, Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QueriedSquareLocation } from '@/data-model/_external/data-sources/square/SquareType';
import {
  mapEthAddressToAddress,
  mapToEthAddress,
} from '@/data-model/ethereum/EthereumDTO';
import { ChainId, EthAddress } from '@/data-model/ethereum/EthereumType';
import { SquareShopConfig } from '@/data-model/shop/ShopType';
import { MinSquareConnection } from '@/data-model/square-connection/SquareConnectionType';
import { useErrorToast, useToast } from '@/lib/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { isAddress } from 'viem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Local API helpers
import {
  syncSquareLocation,
  deleteShopConfig,
  updateShopConfig,
} from './api-calls';

const SquareLocation: React.FC<{
  location: QueriedSquareLocation;
  connection: MinSquareConnection;
  shopConfig: SquareShopConfig | 'not-added';
}> = ({ location, connection, shopConfig }) => {
  const isAdded = shopConfig !== 'not-added';
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  // editable state
  const [name, setName] = useState<string>(
    isAdded ? (shopConfig.name ?? location.name) : location.name,
  );
  const [logoUrl, setLogoUrl] = useState<string>(
    isAdded
      ? (shopConfig.logo ?? location.logoUrl ?? '')
      : (location.logoUrl ?? ''),
  );
  const [backgroundImage, setBackgroundImage] = useState<string>(
    isAdded ? (shopConfig.backgroundImage ?? '') : '',
  );
  const [websiteUrl, setWebsiteUrl] = useState<string>(
    isAdded ? (shopConfig.url ?? '') : '',
  );
  const [fundRecipient, setFundRecipient] = useState<EthAddress | null>(
    isAdded ? (shopConfig.fundRecipientConfig?.recipient ?? null) : null,
  );
  const [tipRecipient, setTipRecipient] = useState<EthAddress | null>(
    isAdded ? (shopConfig.tipConfig?.recipient ?? null) : null,
  );
  // location state
  const [locationLabel, setLocationLabel] = useState<string>(
    isAdded && shopConfig.location ? shopConfig.location.label : '',
  );
  const [locationAddress, setLocationAddress] = useState<string>(
    isAdded && shopConfig.location ? shopConfig.location.address : '',
  );
  const [latitude, setLatitude] = useState<string>(
    isAdded && shopConfig.location ? String(shopConfig.location.coords[0]) : '',
  );
  const [longitude, setLongitude] = useState<string>(
    isAdded && shopConfig.location ? String(shopConfig.location.coords[1]) : '',
  );
  const errorToast = useErrorToast();
  const successToast = useToast();

  const updateConfigMutation = useMutation({
    mutationFn: () =>
      updateShopConfig(
        isAdded ? 'update' : 'add',
        connection.merchantId,
        location.id,
        {
          name: name || undefined,
          logo: logoUrl || undefined,
          backgroundImage: backgroundImage || undefined,
          url: websiteUrl || undefined,
          fundRecipient: fundRecipient ?? undefined,
          tipRecipient: tipRecipient ?? undefined,
          location:
            locationLabel && locationAddress && latitude && longitude
              ? {
                  label: locationLabel,
                  address: locationAddress,
                  coords: [parseFloat(latitude), parseFloat(longitude)],
                }
              : undefined,
        },
      ).then(() => syncSquareLocation(connection.merchantId, location.id)),
    onMutate: () => setSyncing(true),
    onSuccess: () => {
      setSyncing(false);
      queryClient.invalidateQueries({ queryKey: ['square-connection-status'] });
      successToast.toast({
        title: 'Success',
        description: 'Location updated successfully',
      });
    },
    onError: e => {
      errorToast(e);
      setSyncing(false);
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: () => deleteShopConfig(connection.merchantId, location.id),
    onMutate: () => setSyncing(true),
    onSuccess: () => {
      setSyncing(false);
      queryClient.invalidateQueries({ queryKey: ['square-connection-status'] });
      successToast.toast({
        title: 'Success',
        description: 'Location successfully removed',
      });
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
    <Card className="w-full max-w-[390px] overflow-hidden">
      {/* Background Image Preview */}
      <div className="relative h-56 sm:h-72 w-full max-w-[390px]">
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt="store background"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-600 text-sm font-medium">
            No Background Image!
          </div>
        )}
        {/* Logo */}
        <div className="absolute top-4 left-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={logoUrl} />
          </Avatar>
        </div>
      </div>

      {/* Form Section */}
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`name-${location.id}`}>Location Name</Label>
            <Input
              id={`name-${location.id}`}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Website URL */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`website-${location.id}`}>Website URL</Label>
            <Input
              id={`website-${location.id}`}
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
            />
          </div>

          {/* Logo URL */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`logo-${location.id}`}>Logo URL</Label>
            <Input
              id={`logo-${location.id}`}
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
            />
          </div>

          {/* Background Image URL */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`bg-${location.id}`}>Background Image URL</Label>
            <Input
              id={`bg-${location.id}`}
              value={backgroundImage}
              onChange={e => setBackgroundImage(e.target.value)}
            />
          </div>

          {/* Fund Recipient */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`fund-recipient-${location.id}`}>
              Fund Recipient
            </Label>
            <Input
              id={`fund-recipient-${location.id}`}
              type="text"
              value={fundRecipient ? mapEthAddressToAddress(fundRecipient) : ''}
              placeholder="0x..."
              onChange={handleAddressChange(setFundRecipient)}
            />
          </div>

          {/* Tip Recipient */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`tip-recipient-${location.id}`}>
              Tip Recipient
            </Label>
            <Input
              id={`tip-recipient-${location.id}`}
              type="text"
              value={tipRecipient ? mapEthAddressToAddress(tipRecipient) : ''}
              placeholder="0x..."
              onChange={handleAddressChange(setTipRecipient)}
            />
          </div>

          {/* Location Label */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`loc-label-${location.id}`}>Location Label</Label>
            <Input
              id={`loc-label-${location.id}`}
              value={locationLabel}
              onChange={e => setLocationLabel(e.target.value)}
            />
          </div>

          {/* Location Address */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`loc-address-${location.id}`}>
              Location Address
            </Label>
            <Input
              id={`loc-address-${location.id}`}
              value={locationAddress}
              onChange={e => setLocationAddress(e.target.value)}
            />
          </div>

          {/* Latitude */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`loc-lat-${location.id}`}>Latitude</Label>
            <Input
              id={`loc-lat-${location.id}`}
              type="number"
              min={-90}
              max={90}
              value={latitude}
              onChange={e => setLatitude(e.target.value)}
            />
          </div>

          {/* Longitude */}
          <div className="flex flex-col gap-1">
            <Label htmlFor={`loc-lng-${location.id}`}>Longitude</Label>
            <Input
              id={`loc-lng-${location.id}`}
              type="number"
              min={-180}
              max={180}
              value={longitude}
              onChange={e => setLongitude(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <CTAButton
            variant="cta-small"
            isLoading={syncing}
            onClick={() => updateConfigMutation.mutate()}
            className={isAdded ? 'w-1/3' : 'w-1/2'}
          >
            Save & Sync
          </CTAButton>
          <Button
            variant="outline"
            className={isAdded ? 'w-1/3' : 'w-1/2'}
            onClick={() => {
              // reset state
              if (shopConfig !== 'not-added') {
                setName(shopConfig.name ?? location.name);
                setLogoUrl(shopConfig.logo ?? location.logoUrl ?? '');
                setBackgroundImage(shopConfig.backgroundImage ?? '');
                setWebsiteUrl(shopConfig.url ?? '');
                setFundRecipient(
                  shopConfig.fundRecipientConfig?.recipient ?? null,
                );
                setTipRecipient(shopConfig.tipConfig?.recipient ?? null);
              } else {
                setName(location.name);
                setLogoUrl(location.logoUrl ?? '');
                setBackgroundImage('');
                setWebsiteUrl('');
                setFundRecipient(null);
                setTipRecipient(null);
              }
            }}
          >
            Cancel
          </Button>
          {isAdded && (
            <Button
              variant="destructive"
              className="w-1/3"
              disabled={syncing}
              onClick={() => deleteConfigMutation.mutate()}
            >
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SquareLocation;
