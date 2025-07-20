import { ImageResponse } from 'next/og';
import ShopService from '@/services/ShopService';
import { UUID } from '@/data-model/_common/type/CommonType';
// Edge runtime does not support Node.js 'fs' or 'path'.
// Load the font using the web Fetch API and import.meta.url instead.

// Pre-fetch Diary Notes font as ArrayBuffer (executed at module init time).
const diaryNotesFontPromise = fetch(
  new URL('../../../../assets/fonts/diary-notes.ttf', import.meta.url),
).then(res => res.arrayBuffer());

export const config = {
  runtime: 'edge',
};

// -----------------------------
//  GET handler – /api/shops/:shopId/og
// -----------------------------
export default async function (request: Request) {
  try {
    // Ensure font is loaded (Edge caches across requests after first load)
    const diaryNotesArrayBuffer = await diaryNotesFontPromise;

    const url = new URL(request.url);

    // The pathname looks like: /api/shops/<shopId>/og
    // Extract the <shopId> segment.
    const pathnameParts = url.pathname.split('/');
    const shopIdx = pathnameParts.findIndex(part => part === 'shops');
    const shopId = shopIdx !== -1 ? pathnameParts[shopIdx + 1] : undefined;

    if (!shopId) {
      return new Response('Missing shopId in path.', { status: 400 });
    }

    // Fetch shop data – we only need backgroundImage & logo.
    const shop = await ShopService.findById(shopId as UUID, {
      rehydrate: false,
    });
    if (!shop) {
      return new Response(`Shop ${shopId} not found.`, { status: 404 });
    }

    const makeAbsolute = (
      src: string | null | undefined,
    ): string | undefined => {
      if (!src) return undefined;
      if (/^https?:\/\//.test(src)) return src;
      // prepend origin ensuring single slash
      return `${url.origin}${src.startsWith('/') ? '' : '/'}${src}`;
    };

    const convertIfWebp = (absUrl: string | undefined): string | undefined => {
      if (!absUrl) return undefined;
      if (absUrl.endsWith('.webp')) {
        // Use weserv.nl to convert to png on the fly (edge cached)
        return `https://wsrv.nl/?url=${encodeURIComponent(absUrl)}&output=png`; // returns png
      }
      return absUrl;
    };

    const backgroundSrc = convertIfWebp(makeAbsolute(shop.backgroundImage));
    const logoSrc = convertIfWebp(makeAbsolute(shop.logo));

    if (!backgroundSrc) {
      return new Response('Shop is missing background image', { status: 500 });
    }

    // Dimensions – 3/2 aspect ratio as requested
    const WIDTH = 1200;
    const HEIGHT = 800;
    console.log('backgroundSrc', backgroundSrc);
    console.log('logoSrc', logoSrc);
    return new ImageResponse(
      (
        <div
          style={{
            width: WIDTH,
            height: HEIGHT,
            position: 'relative',
            display: 'flex',
          }}
        >
          {/* Splash background image */}
          <img
            width={WIDTH}
            height={HEIGHT}
            src={backgroundSrc}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Bottom-left logo container */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 40,
              width: 200,
              height: 200,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Shop logo – unknown dimensions, so constrain via max sizes */}
            {logoSrc && (
              <img
                width={160}
                height={160}
                src={logoSrc}
                style={{
                  maxWidth: '90%',
                  maxHeight: '90%',
                  objectFit: 'contain',
                }}
              />
            )}
          </div>

          {/* Bottom-right Drip wordmark */}
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              right: 60,
              fontFamily: 'DiaryNotes',
              fontSize: 120,
              color: '#FFFFFF',
              textShadow: '0 0 4px rgba(0,0,0,0.4)',
            }}
          >
            Drip
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          // Cache aggressively – 1 year
          'Cache-Control':
            'public, max-age=0, s-maxage=0, stale-while-revalidate',
        },
        fonts: [
          {
            name: 'DiaryNotes',
            data: diaryNotesArrayBuffer,
            weight: 400,
            style: 'normal',
          },
        ],
      },
    );
  } catch (e: any) {
    console.error('[shop OG] error generating image', e);
    return new Response('Failed to generate the image', { status: 500 });
  }
}
