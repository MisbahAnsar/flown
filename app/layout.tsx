import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppProviders } from "@/components/app-providers";
import { OnboardingBanner } from "@/components/onboarding/onboarding-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Give flowm a plain-English instruction. A 3-agent pipeline runs it and logs every action on Stellar testnet for a verifiable audit trail.";

export const metadata: Metadata = {
  title: {
    default: "flowm",
    template: "%s · flowm",
  },
  description: siteDescription,
  applicationName: "flowm",
  keywords: [
    "flowm",
    "Stellar",
    "Soroban",
    "GitHub",
    "agents",
    "audit trail",
    "testnet",
  ],
  authors: [{ name: "flowm" }],
  creator: "flowm",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "flowm",
    title: "flowm",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "flowm",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-w-0 flex-col overflow-x-hidden">
        <AppProviders>
          <AppHeader />
          <OnboardingBanner />
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
          <AppFooter />
        </AppProviders>
      </body>
    </html>
  );
}
