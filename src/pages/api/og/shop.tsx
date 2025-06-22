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
  const host = req.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const font = fetch(
    new URL('/fonts/diary-notes.ttf', `${protocol}://${host}`),
  ).then((res) => res.arrayBuffer());

  if (!shopId) {
    return new ImageResponse(<>Visit drip.com</>, {
      width: 1200,
      height: 630,
    });
  }

  const shop = await fetch(
    `${protocol}://${host}/api/shops/${shopId}`,
  ).then((res) => res.json());

  const shopName = shop.name || 'a friend';
  const fontData = await font;

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
          backgroundImage: `url(${protocol}://${host}${shop.backgroundImage})`,
          backgroundSize: '100% 100%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        />
        <img
          src={`${protocol}://${host}/drip.png`}
          style={{
            width: 200,
            height: 200,
          }}
          alt="Drip Logo"
        />
        <div
          style={{
            marginTop: 40,
            fontSize: 60,
            fontFamily: '"Diary Notes"',
            color: 'white',
          }}
        >
          Buy a coffee from {shopName}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Diary Notes',
          data: fontData,
          style: 'normal',
        },
      ],
    },
  );
}