import type { Metadata } from "next"
import localFont from "next/font/local"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "XMBot - Automated Gold Trading",
  description:
    "Algorithmic trading bot for XAUUSD. Remove emotions. Enforce discipline. Trade 24/5.",
  keywords: ["trading bot", "gold", "XAUUSD", "algorithmic trading", "automated trading"],
  openGraph: {
    title: "XMBot - Automated Gold Trading",
    description: "Algorithmic trading bot for XAUUSD, backtested and battle-tested.",
    siteName: "XMBot",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
