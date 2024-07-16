import { BackSvg } from '@/components/Helpers';
import { StaticPageData } from '@/pages/shop/[shopId]';
import { CarSimple } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';

export function ShopHeader({
  backgroundImage,
  logo,
}: {
  backgroundImage: string;
  logo: string;
}) {
  return (
    <header className="relative h-[25vh]">
      <Image src={backgroundImage} alt="backdrop" quality={20} fill={true} />
      <Image
        src={logo}
        alt="logo"
        width={75}
        height={75}
        quality={20}
        className="absolute -bottom-5 left-5 rounded-full shadow-lg"
      />
      <Link href="/">
        <BackSvg />
      </Link>
    </header>
  );
}

export function ShopHeaderDetails(staticShop: StaticPageData) {
  return (
    <div className="flex flex-col  pt-3 font-sans text-[16px] font-semibold">
      <h1 className="text-[32px] font-sans font-medium ">{staticShop.label}</h1>
      <div className="flex items-center gap-1">
        <CarSimple weight="bold" />
        <p className="text-sm font-normal text-neutral-400">
          {staticShop.location
            ? staticShop.location?.join(', ')
            : 'Online only'}
        </p>
      </div>
    </div>
  );
}
