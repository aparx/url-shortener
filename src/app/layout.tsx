import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-primary",
});

const code = Inter({
  subsets: ["latin"],
  variable: "--font-code",
});

export const metadata: Metadata = {
  title: "URL shortener",
  description:
    "Secure URL Shortener that offers advanced features such as Expiration, One Time Use, Password Protection and more. Perfect for managing links securely and efficiently!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${code.variable} bg-black text-neutral-200 antialiased text-sm font-[family-name:var(--font-primary)]`}
      >
        <div className="bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(white,rgba(0,0,0,.25))] -z-10 absolute inset-0 bg-transparent bg-[size:24px_24px] w-full h-full" />
        {children}
      </body>
    </html>
  );
}
