import { Farmer } from '@/data-model/farmer/FarmerType';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { Label1, Title1 } from '../ui/typography';
import { DonationButton } from './donation-button';
import { SendMessageButton } from './message-button';

export const FarmerNavigation = () => {
  const router = useRouter();
  return (
    <div className="flex items-center py-4 px-6">
      <button onClick={() => router.back()}>
        <ArrowLeft height={24} width={24} strokeWidth={2.4} />
      </button>
    </div>
  );
};

export function FarmerHeader({ farmer }: { farmer: Farmer | 'loading' }) {
  const isLoading = farmer === 'loading';

  return (
    <div className="w-full flex flex-col gap-4 px-6">
      <div className="flex flex-col gap-2 items-center">
        <div className="w-[120px] h-[120px] rounded-full overflow-clip">
          {isLoading ? (
            <Skeleton className="w-[120px] h-[120px] rounded-full" />
          ) : (
            <Image
              src={farmer?.pfp || farmer?.image}
              alt="backdrop"
              height={120}
              width={120}
              className="rounded-full"
            />
          )}
        </div>
        {isLoading ? (
          <Skeleton className="w-[180px] h-[37px]" />
        ) : (
          <Title1 className="text-center align-center">{farmer?.name}</Title1>
        )}
        {isLoading ? (
          <Skeleton className="w-[200px] h-[17px]" />
        ) : (
          <Label1 className="text-center align-top text-primary-gray">
            {farmer?.shortDescription}
          </Label1>
        )}
      </div>
      {isLoading ? (
        <div className="flex gap-2">
          <Skeleton className="w-full h-10 rounded-[50px]" />
          <Skeleton className="w-full h-10 rounded-[50px]" />
        </div>
      ) : (
        <div className="flex gap-2">
          <DonationButton farmer={farmer} />
          <SendMessageButton farmer={farmer} />
        </div>
      )}
    </div>
  );
}
