import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthWrapper } from "@/components/layout/AuthWrapper";
import { Providers } from "./providers";
import { SearchFAB } from "@/components/search/SearchFAB";
import { NavigationProgress } from "@/components/layout/NavigationProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restaurant Reviews - Private Reviews for Friends & Family",
  description: "A private, invite-only restaurant review site for your trusted network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <NavigationProgress />
          <AuthWrapper>
            {children}
            <SearchFAB />
          </AuthWrapper>
        </Providers>
      </body>
    </html>
  );
}
