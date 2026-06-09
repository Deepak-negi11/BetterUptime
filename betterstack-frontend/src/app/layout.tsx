import React from "react"
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from "@/components/ui/sonner"

const _geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'UpSignal - Know Before They Do',
  description: 'Self-hosted, multi-region uptime monitoring for websites and APIs.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_geist.className} antialiased`} suppressHydrationWarning={true} >
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
