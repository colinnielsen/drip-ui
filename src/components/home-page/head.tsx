import Head from 'next/head';

export function HomePageHead() {
  const title = `Order Coffee on Drip`;
  const description = `Buy coffee from local cafes using USDC. Support farmers and local businesses.`;
  const url = `https://dripapp.xyz`;

  const miniapp = {
    version: '1',
    imageUrl: 'https://dripapp.xyz/og-image.png',
    button: {
      title: '☕ Order Coffee',
      action: {
        type: 'launch_miniapp',
        url: 'https://dripapp.xyz',
        name: 'Drip Coffee',
        splashImageUrl: 'https://dripapp.xyz/drip-logo.png',
        splashBackgroundColor: '#EFE8DB',
      },
    },
  };

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={miniapp.imageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Drip Coffee" />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={miniapp.imageUrl} />

      {/* Farcaster MiniApp Meta Tags */}
      <meta name="fc:miniapp" content={JSON.stringify(miniapp)} />
    </Head>
  );
}
