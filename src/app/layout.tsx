import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/session-provider";
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider";
import { ServiceWorkerStatus } from "@/components/debug/service-worker-status";
import { CacheInspector } from "@/components/debug/cache-inspector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true, // Preload critical fonts
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: false, // Only preload primary font
});

export const metadata: Metadata = {
  title: "Blog Công Nghệ",
  description:
    "Khám phá những bài viết mới nhất về công nghệ, lập trình và phát triển phần mềm",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerProvider>
          <Providers>{children}</Providers>
          <ServiceWorkerStatus />
          <CacheInspector />
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
