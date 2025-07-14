import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FloatingDock } from "@/components/layout/FloatingDock";
import { AuthProvider } from "@/providers/AuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Whispr - Speak softly. Help loudly.",
  description: "Anonymous review platform for IIITH courses and professors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased pb-16 px-4 md:px-0`}>
        <AuthProvider>
          <ToastProvider>
            {children}
            <FloatingDock />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
