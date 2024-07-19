import drip from '@/assets/drip.jpg';
import { HomePageHeader } from '@/components/home-page/header';
import { ShopList } from '@/components/home-page/shop-list';
import { WelcomeDialog } from '@/components/home-page/welcome-popup';
import { useShops } from '@/queries/ShopQuery';

export default function Home() {
  const { data: shops, isLoading, error } = useShops();

  return (
    <div className="flex flex-col gap-5 pb-32">
      <HomePageHeader />
      {/* <div className="w-screen max-h-64 overflow-hidden">
        <Image src={map} alt="coffee" />
      </div> */}

      {error ? (
        <div className="p-4 text-red-500">Error: {error.message}</div>
      ) : (
        <ShopList
          title="Participating shops"
          shops={shops ?? []}
          isLoading={isLoading}
        />
      )}

      <WelcomeDialog
        title="Welcome to Drip"
        image={drip}
        imageAlt="coffee"
        description="Drip is a coffee app designed to reward growers and local farms. For every coffee you buy with USDC, the more growers earn."
        buttonText="let's go"
        defaultOpen={false}
      />
    </div>
  );
}
