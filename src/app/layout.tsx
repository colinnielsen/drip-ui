import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
// Font files can be colocated inside of `app`
const myFont = localFont({
  src: "../assets/diary-notes.ttf",
  variable: "--font-diary-notes",
});

/* export const metadata: Metadata = {
 *   title: "Drip Coffee",
 *   description: "Onchain coffee breh",
 * }; */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReactQueryClientProvider>
      <html lang="en" className={myFont.variable}>
        <body className={inter.className}>{children}</body>
      </html>
    </ReactQueryClientProvider>
  );
}
