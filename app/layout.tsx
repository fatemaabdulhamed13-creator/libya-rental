import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SearchProvider } from "@/contexts/search-context";
import SupabaseAuthListener from "@/components/SupabaseAuthListener";
import Footer from "@/components/Footer";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Libya Rentals",
  description: "Find your perfect stay in Libya",
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
          <div className="flex-grow">
            {children}
          </div>
        </SearchProvider>
        <Footer />
      </body>
    </html>
  );
}
