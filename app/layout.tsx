import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Syne } from "next/font/google";
import { Suspense } from "react";
import { Site } from "@/components/Site";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Inkspilled",
    template: "%s",
  },
  description: "A motion-first creative studio. Ads, brand films, identity and social for brands that need to move.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${syne.variable} ${instrument.variable} ${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('locked')}catch(e){}",
          }}
        />
        <Suspense fallback={<div className="fixed inset-0 z-30 bg-ink" aria-hidden />}>
          <Site fontFamily={syne.style.fontFamily} />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
