import type { Metadata, Viewport } from "next";
import { Providers } from "@/providers/providers";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "DermoAI — AI Skin Triage",
  description:
    "AI-assisted dermatological triage for resource-limited settings in Rwanda. Get instant skin condition predictions optimized for darker skin tones.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/icons/icon-192x192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DermoAI",
  },
};

export const viewport: Viewport = {
  themeColor: "#078ece",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,900&display=swap"
        />
      </head>
      <body className="antialiased font-sans">
        <Providers>
          <OfflineIndicator />
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
