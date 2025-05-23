import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { FloatingDock } from '@/components/layout/FloatingDock'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Whispr - Speak softly. Help loudly.',
  description: 'Anonymous review platform for IIITH courses and professors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
        <FloatingDock />
      </body>
    </html>
  )
}