import '../styles/globals.css';
import { ReactQueryClientProvider } from '@/components/ReactQueryClientProvider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { cn } from '@/lib/utils';
import { AppProps } from 'next/app';
import { EB_Garamond, Libre_Franklin, Roboto_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { Footer } from '@/components/Footer';

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

/* export const metadata: Metadata = {
 *   title: "Drip Coffee",
 *   description: "Onchain coffee breh",
 * }; */

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ReactQueryClientProvider>
      <div
        className={cn(
          'antialiased',
          diaryNotes.variable,
          garamond.variable,
          `${libreFranklin.variable} font-sans`,
          `${robotoMono.variable}`,
          // 'prose',
        )}
      >
        <Component {...pageProps} />
        <Footer />
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </ReactQueryClientProvider>
  );
}
