import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

const siteDescription =
  "Give flowms a plain-English instruction. A 3-agent pipeline runs it and logs every action on Stellar testnet for a verifiable audit trail.";

export const metadata: Metadata = {
  title: {
    default: "flowms",
    template: "%s · flowms",
  },
  description: siteDescription,
  applicationName: "flowms",
  keywords: [
    "flowms",
    "Stellar",
    "Soroban",
    "GitHub",
    "agents",
    "audit trail",
    "testnet",
  ],
  authors: [{ name: "flowms" }],
  creator: "flowms",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "flowms",
    title: "flowms",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "flowms",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafafa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-w-0 flex-col overflow-x-hidden bg-[#fafafa] text-zinc-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
