import { BackSvg } from '@/components/ui/icons';
import { StaticPageData } from '@/pages/shop/[shopId]';
import { CarSimple } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { Label2 } from '../ui/typography';

export function ShopHeader({
  backgroundImage,
  logo,
}: {
  backgroundImage: string;
  logo: string;
}) {
  return (
    <header className="relative h-[25vh]">
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt="backdrop"
          quality={20}
          fill={true}
          className="object-cover"
        />
      )}
      {logo && (
        <Image
          src={logo}
          alt="logo"
          width={75}
          height={75}
          quality={20}
          className="absolute -bottom-6 left-6 rounded-full shadow-lg aspect-square object-cover"
        />
      )}
      <Link href="/">
        <BackSvg />
      </Link>
    </header>
  );
}

export function ShopHeaderDetails(staticShop: StaticPageData) {
  return (
    <div className="flex flex-col gap-2 pt-3 font-sans text-[16px] font-semibold">
      <h1 className="text-[32px] font-sans font-medium">{staticShop.label}</h1>
      <div className="flex items-center gap-2">
        <CarSimple weight="bold" />
        <Label2>
          {staticShop.location ? (
            <>
              {staticShop.location.address.split(',').slice(0, -2).join(', ')}
              <br />
              {staticShop.location.address.split(',').slice(-2).join(', ')}
            </>
          ) : (
            'Online only'
          )}
        </Label2>
      </div>
    </div>
  );
}
