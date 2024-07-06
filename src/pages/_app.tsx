import "../styles/globals.css";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { cn } from "@/lib/utils";
import { AppProps } from "next/app";
import { Inter } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({ subsets: ["latin"] });
const diaryNotes = localFont({
  src: "../assets/fonts/diary-notes.ttf",
  variable: "--font-diary-notes",
});

/* export const metadata: Metadata = {
 *   title: "Drip Coffee",
 *   description: "Onchain coffee breh",
 * }; */

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ReactQueryClientProvider>
      <main className={cn("antialiased", diaryNotes.variable, inter.className)}>
        <Component {...pageProps} />
      </main>
      <ReactQueryDevtools initialIsOpen={false} />
    </ReactQueryClientProvider>
  );
}
