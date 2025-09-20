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
  title: 'Avatar try-on',
  description: 'Try on your avatar',
  generator: 'v0.app',
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
