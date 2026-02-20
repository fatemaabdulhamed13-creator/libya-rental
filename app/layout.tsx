import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SearchProvider } from "@/contexts/search-context";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Libya Rentals",
  description: "Find your perfect stay in Libya",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} antialiased bg-gray-50 text-gray-900`}>
        <SearchProvider>
          {children}
        </SearchProvider>
      </body>
    </html>
  );
}
