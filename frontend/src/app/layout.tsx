import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FloatingDock } from "@/components/layout/FloatingDock";
import { AuthProvider } from "@/providers/AuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Whispr - Speak softly. Help loudly.",
  description:
    "Anonymous review platform for IIITH courses and professors with institutional authentication",
  keywords: [
    "IIITH",
    "course reviews",
    "professor reviews",
    "anonymous reviews",
    "institutional authentication",
    "CAS authentication",
    "International Institute of Information Technology Hyderabad",
    "student reviews",
    "academic reviews",
    "course ratings",
    "professor ratings",
  ],
  authors: [
    {
      name: "OSDG IIITH",
      url: "https://github.com/OSDG-IIITH",
    },
  ],
  creator: "OSDG IIITH",
  publisher: "OSDG IIITH",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    apple: [
      { url: "/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/apple-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/apple-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/android-icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  themeColor: "#000000",
  colorScheme: "dark",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    title: "Whispr - Anonymous Course & Professor Reviews",
    description:
      "Privacy-first anonymous review platform for IIITH students. Share honest feedback about courses and professors with institutional authentication.",
    url: "https://osdg.iiit.ac.in/whispr",
    siteName: "Whispr",
    images: [
      {
        url: "https://osdg.iiit.ac.in/whispr/logo.png",
        width: 1200,
        height: 630,
        alt: "Whispr - Anonymous Review Platform for IIITH",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Whispr - Anonymous Course & Professor Reviews",
    description:
      "Privacy-first anonymous review platform for IIITH students. Share honest feedback with institutional authentication.",
    images: ["https://osdg.iiit.ac.in/whispr/logo.png"],
  },
  alternates: {
    canonical: "https://osdg.iiit.ac.in/whispr",
  },
  category: "education",
  classification: "Educational Platform",
  other: {
    "msapplication-TileColor": "#000000",
    "msapplication-TileImage": "/ms-icon-144x144.png",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-black text-white antialiased pb-16`}
      >
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              {children}
              <FloatingDock />
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
