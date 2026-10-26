import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { Site } from "@/components/Site";
import { getContent } from "@/lib/sanity";
import "./globals.css";

// Self-hosted latin subsets. next/font/google fails on Next 16.4.2 when Google
// returns extensionless /l/font?kit= URLs (the query is split on "&").
const syne = localFont({
  src: "./fonts/syne-latin.woff2",
  weight: "500 800",
  variable: "--font-syne",
  display: "swap",
});

const instrument = localFont({
  src: [
    {
      path: "./fonts/instrument-serif-latin.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/instrument-serif-italic-latin.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const geist = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "400 500",
  variable: "--font-geist",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  weight: "400 500",
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

async function SiteWithContent() {
  const content = await getContent();
  return <Site fontFamily={syne.style.fontFamily} content={content} />;
}

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
          <SiteWithContent />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
