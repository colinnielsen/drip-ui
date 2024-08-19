import { Footer } from '@/components/app-footer';
import { GlobalListeners } from '@/components/global-listeners';
import { PrivyProvider } from '@/components/providers.tsx/PrivyProvider';
import { ReactQueryClientProvider } from '@/components/providers.tsx/ReactQueryClientProvider';
import { cn } from '@/lib/utils';
import { AppProps } from 'next/app';
import { EB_Garamond, Libre_Franklin, Roboto_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import Head from 'next/head';
import '../styles/globals.css';
import { WagmiProvider } from '@privy-io/wagmi';
import { sliceKit } from '@/lib/slice';

const garamond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
});
const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-libre-franklin',
});
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  // weight: '500',
  variable: '--font-roboto-mono',
});
const diaryNotes = localFont({
  src: '../assets/fonts/diary-notes.ttf',
  variable: '--font-diary-notes',
});

export const CSS_FONT_CLASS_CONFIG = cn(
  'antialiased',
  diaryNotes.variable,
  garamond.variable,
  `${libreFranklin.variable} font-sans`,
  `${robotoMono.variable}`,
);

/* export const metadata: Metadata = {
 *   title: "Drip Coffee",
 *   description: "Onchain coffee breh",
 * }; */

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider>
      <ReactQueryClientProvider useDevTools>
        <WagmiProvider config={sliceKit.wagmiConfig}>
          <div
            className={cn(
              CSS_FONT_CLASS_CONFIG,
              'bg-background',
              'min-h-screen',
              // 'prose',
            )}
          >
            <Head>
              <title>Drip</title>
              <meta
                name="viewport"
                content="width=device-width, user-scalable=no"
              />
            </Head>
            <Component {...pageProps} />
            <Footer />
            <GlobalListeners />
          </div>
        </WagmiProvider>
      </ReactQueryClientProvider>
    </PrivyProvider>
  );
}
