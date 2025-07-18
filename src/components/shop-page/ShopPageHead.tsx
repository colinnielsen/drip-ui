import Head from 'next/head';
import { StaticPageData } from '@/pages/shop/[shopId]';

type ShopPageHeadProps = {
  shop: StaticPageData;
};

export function ShopPageHead({ shop }: ShopPageHeadProps) {
  const shopTitle = `${shop.label} - Order Coffee on Drip`;
  const shopDescription = `Buy a coffee from ${shop.label}. Fresh coffee delivered through blockchain technology.`;
  const shopImage = shop.backgroundImage || '/drip.jpg';
  const shopUrl = `https://dripapp.xyz/shop/${shop.id}`;

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
      
      {/* Farcaster Frame Meta Tags */}
      <meta name="fc:frame" content="vNext" />
      <meta name="fc:frame:image" content={`/api/og/shop/${shop.id}`} />
      <meta name="fc:frame:button:1" content={`Buy from ${shop.label}`} />
      <meta name="fc:frame:button:1:action" content="link" />
      <meta name="fc:frame:button:1:target" content={shopUrl} />
      
      {/* Location meta if available */}
      {shop.location && (
        <>
          <meta name="geo.placename" content={shop.location.label} />
          <meta name="geo.position" content={`${shop.location.coords[0]};${shop.location.coords[1]}`} />
          <meta name="geo.address" content={shop.location.address} />
        </>
      )}
    </Head>
  );
}