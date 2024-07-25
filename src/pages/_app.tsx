import { Footer } from '@/components/Footer';
import { ReactQueryClientProvider } from '@/components/providers.tsx/ReactQueryClientProvider';
import { cn, isDev } from '@/lib/utils';
import { AppProps } from 'next/app';
import { EB_Garamond, Libre_Franklin, Roboto_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import '../styles/globals.css';
import { PrivyProvider } from '@/components/providers.tsx/PrivyProvider';
import { WagmiProvider } from '@privy-io/wagmi';
import { PRIVY_WAGMI_CONFIG } from '@/lib/ethereum';

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
      <ReactQueryClientProvider useDevTools={isDev()}>
        <WagmiProvider config={PRIVY_WAGMI_CONFIG}>
          <div
            className={cn(
              CSS_FONT_CLASS_CONFIG,
              'bg-background',
              'min-h-screen',
              // 'prose',
            )}
          >
            <Component {...pageProps} />
            <Footer />
          </div>
        </WagmiProvider>
      </ReactQueryClientProvider>
    </PrivyProvider>
  );
}
