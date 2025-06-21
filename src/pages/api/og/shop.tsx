import { UUID } from '@/data-model/_common/type/CommonType';
import ShopService from '@/services/ShopService';
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');

  if (!shopId) {
    return new ImageResponse(<>Visit drip.com</>, {
      width: 1200,
      height: 630,
    });
  }

  // This is a bit of a hack because edge routes can't query the db directly
  // So we call our own api route to get the shop data
  const host = req.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const shop = await fetch(
    `${protocol}://${host}/api/shops/${shopId}`,
  ).then((res) => res.json());

  const shopName = shop.name || 'a friend';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        <img
          src={`${protocol}://${host}/drip.png`}
          style={{
            width: 200,
            height: 200,
          }}
          alt="Drip Logo"
        />
        <div style={{ marginTop: 40, fontSize: 60 }}>
          Buy a coffee from {shopName}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}