import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://persistent-form-pushpushpushprojects.vercel.app"),
  title: "Grower Direct | Order Hay",
  description: "Order premium alfalfa and wheat hay directly from the farm. Fast pickup or delivery available.",
  openGraph: {
    title: "Grower Direct | Order Hay",
    description: "Order premium alfalfa and wheat hay directly from the farm. Fast pickup or delivery available.",
    url: "https://growerdirect.vercel.app", // Fallback URL, typically updated to real domain
    siteName: "Grower Direct",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Grower Direct Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grower Direct | Order Hay",
    description: "Order premium alfalfa and wheat hay directly from the farm. Fast pickup or delivery available.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
