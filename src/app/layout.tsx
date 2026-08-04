import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SWRegister } from "@/components/SWRegister";
import { TimezoneCookie } from "@/components/TimezoneCookie";

const outfit = localFont({
  src: "../fonts/outfit-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: { default: "Orbit", template: "%s — Orbit" },
  description: "Your people, in orbit. A personal CRM for your network and friendships.",
  applicationName: "Orbit",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Orbit",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0ede5" },
    { media: "(prefers-color-scheme: dark)", color: "#14120d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${outfit.variable}`}>
      <body className="min-h-dvh">
        {children}
        <SWRegister />
        <TimezoneCookie />
      </body>
    </html>
  );
}
