import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Source_Serif_4 } from "next/font/google"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { StructuredData } from "@/components/structured-data"
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
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  weight: ["500", "600", "700"],
})

export const metadata: Metadata = {
  title: {
    default: "XMBot — AI-Powered Gold Trading Platform",
    template: "%s | XMBot",
  },
  description:
    "Multi-agent AI system for XAUUSD trading with human-in-the-loop approval. 64% backtested win rate. Trade gold with AI agents — you stay in control.",
  keywords: [
    "trading bot",
    "gold trading",
    "XAUUSD",
    "AI trading",
    "algorithmic trading",
    "automated trading",
    "forex bot",
    "gold bot",
    "PAXG",
    "Binance",
    "Telegram trading",
  ],
  authors: [{ name: "XMBot" }],
  creator: "XMBot",
  publisher: "XMBot",
  alternates: {
    canonical: "https://xmbot.online",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://xmbot.online",
    siteName: "XMBot",
    title: "XMBot — AI-Powered Gold Trading Platform",
    description:
      "Multi-agent AI system for XAUUSD trading with human-in-the-loop approval. 64% backtested win rate.",
    images: [
      {
        url: "https://xmbot.online/og-image.png",
        width: 1200,
        height: 630,
        alt: "XMBot — AI Gold Trading",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XMBot — AI-Powered Gold Trading",
    description:
      "Multi-agent AI system for XAUUSD trading. You approve every trade.",
    images: ["https://xmbot.online/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
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
}

export const viewport: Viewport = {
  themeColor: "#171512",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
