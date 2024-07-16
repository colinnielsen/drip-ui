import drip from '@/assets/drip.jpg';
import map from '@/assets/map.png';
import { WelcomeDialog } from '@/components/Dialog';
import { Header } from '@/components/Header';
import { LocationList } from '@/components/LocationList';
import { useCafes } from '@/queries/CafeQuery';
import Image from 'next/image';

export default function Home() {
  const { data: cafes, isLoading, error } = useCafes();

  return (
    <div className="flex flex-col gap-5 mb-32 bg-red">
      <WelcomeDialog
        title="Welcome to Drip"
        image={drip}
        imageAlt="coffee"
        description="Drip is a coffee app designed to reward growers and local farms. For every coffee you buy with USDC, the more growers earn."
        buttonText="let's go"
        defaultOpen={false}
      />
      <Header />
      <div className="w-screen max-h-64 overflow-hidden">
        <Image src={map} alt="coffee" />
      </div>

      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {error ? null : (
        <>
          <LocationList
            title="Near You"
            cafes={cafes?.slice(0, 2) ?? []}
            isLoading={isLoading}
          />
          <LocationList
            title="Popular"
            cafes={cafes?.slice(2) ?? []}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
