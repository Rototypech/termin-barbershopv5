import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BrandHeader from "../components/BrandHeader";
import CookieConsent from "../components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Barber Shop Brienz – Ihr Herrenfriseur in Interlaken/Brienz",
  description: "Online buchen. Herrenhaarschnitt, Bart, Kinderleistungen. Schnell und bequem.",
  manifest: "/manifest.json",
  icons: {
    icon: "/booking/favicon.ico",
    shortcut: "/booking/favicon-16x16.png",
    apple: "/booking/apple-touch-icon.png",
  },
  appleWebApp: {
    title: "Barber",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Barber Shop Brienz – Ihr Herrenfriseur in Interlaken/Brienz",
    description: "Online buchen. Herrenhaarschnitt, Bart, Kinderleistungen. Schnell und bequem.",
    url: "https://termin.barbershop-brienz.ch",
    siteName: "Barber Shop Brienz",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "de_CH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BrandHeader />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
