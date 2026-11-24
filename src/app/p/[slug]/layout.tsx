import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Serif_Display, Karla } from "next/font/google";
import { siteUrl } from "@/lib/content";
import "../../globals.css";

const serif = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const sans = Karla({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

const quote = Cormorant_Garamond({
  weight: "500",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  title: "Private proposal · Oracle of Freedom",
};

export const viewport: Viewport = {
  themeColor: "#f4ece1",
  width: "device-width",
  initialScale: 1,
};

export default function ProposalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${quote.variable}`}>
      <body className="min-h-screen bg-sand font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
