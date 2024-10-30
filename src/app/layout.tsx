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
        className={`${inter.variable} ${code.variable} bg-black text-neutral-200 antialiased text-sm`}
      >
        {children}
      </body>
    </html>
  );
}
