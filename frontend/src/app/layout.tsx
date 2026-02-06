import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Providers } from "@/providers/providers";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DermoAI — AI Skin Triage",
  description:
    "AI-assisted dermatological triage for resource-limited settings in Rwanda. Get instant skin condition predictions optimized for darker skin tones.",
  manifest: "/manifest.json",
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
    <html lang="en" className={dmSans.variable}>
      <body className={`${dmSans.className} antialiased`}>
        <Providers>
          <OfflineIndicator />
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
