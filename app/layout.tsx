import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SearchProvider } from "@/contexts/search-context";
import SupabaseAuthListener from "@/components/SupabaseAuthListener";
import Footer from "@/components/Footer";
import MobileNav from "@/components/mobile-nav";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ff6b00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "استراحة | Istiraaha",
  description: "اكتشف أجمل الاستراحات والإقامات في ليبيا",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Istiraaha",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} antialiased bg-gray-50 text-gray-900 flex flex-col min-h-screen`}>
        <SupabaseAuthListener />
        <SearchProvider>
          <div className="flex-grow pb-24 md:pb-0">
            {children}
          </div>
        </SearchProvider>
        <Footer />
        <MobileNav />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
