import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Kalam } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const kalam = Kalam({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-kalam',
})

export const metadata: Metadata = {
  title: 'My PFP Glowup',
  description: 'Create your AI avatar from your X profile picture',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${kalam.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
