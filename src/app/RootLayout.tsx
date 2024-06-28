import { inter } from "./layout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      <body className={inter.className}>
        {children}
        {/* <Footer /> */}
      </body>
    </html>
  );
}
