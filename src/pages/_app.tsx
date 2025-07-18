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
import { CartDrawerContext } from '@/components/ui/drawer';
import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { sdk } from '@farcaster/miniapp-sdk';

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

export default function App({ Component, pageProps }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <PrivyProvider>
      <ReactQueryClientProvider useDevTools>
        <CartDrawerContext.Provider
          value={{ open: isOpen, setOpen: setIsOpen }}
        >
          <div
            className={cn(
              CSS_FONT_CLASS_CONFIG,
              'bg-background',
              'min-h-screen',
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
            <Toaster />
          </div>
        </CartDrawerContext.Provider>
      </ReactQueryClientProvider>
    </PrivyProvider>
  );
}
