import Head from 'next/head';
import { StaticPageData } from '@/pages/shop/[shopId]';
import { getAbsoluteUrl } from '@/lib/utils';

type ShopPageHeadProps = {
  shop: StaticPageData;
};

export function ShopPageHead({ shop }: ShopPageHeadProps) {
  const shopTitle = `${shop.label} - Order Coffee on Drip`;
  const shopDescription = `Buy a coffee from ${shop.label}. Fresh coffee delivered through blockchain technology.`;
  const shopImage = shop.backgroundImage || '/drip.jpg';
  const shopUrl = `${getAbsoluteUrl(`/shop/${shop.id}`)}`;

  const miniapp = {
    version: '1',
    imageUrl: `${getAbsoluteUrl(`/api/shops/${shop.id}/og`)}`,
    button: {
      title: `Order ☕ - ${shop.label}`,
      action: {
        type: 'launch_miniapp',
        url: shopUrl,
        name: 'Drip Coffee',
        splashImageUrl: `${getAbsoluteUrl(`/api/shops/${shop.id}/og`)}`,
        splashBackgroundColor: '#EFE8DB',
      },
    },
  };

  return (
    <Head>
      <title>{shopTitle}</title>
      <meta name="description" content={shopDescription} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={shopTitle} />
      <meta property="og:description" content={shopDescription} />
      <meta property="og:image" content={shopImage} />
      <meta property="og:url" content={shopUrl} />
      <meta property="og:site_name" content="Drip Coffee" />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={shopTitle} />
      <meta name="twitter:description" content={shopDescription} />
      <meta name="twitter:image" content={shopImage} />

      {/* Farcaster Mini-app Meta Tag */}
      <meta name="fc:miniapp" content={JSON.stringify(miniapp)} />

      {/* Location meta if available */}
      {shop.location && (
        <>
          <meta name="geo.placename" content={shop.location.label} />
          <meta
            name="geo.position"
            content={`${shop.location.coords[0]};${shop.location.coords[1]}`}
          />
          <meta name="geo.address" content={shop.location.address} />
        </>
      )}
    </Head>
  );
}
