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
    default: "XMOne — AI Investment Platform",
    template: "%s | XMOne",
  },
  description:
    "AI-powered investment platform for gold, stocks, crypto, and mutual funds. Multi-agent AI finds opportunities across India and global markets. You stay in control.",
  keywords: [
    "AI investment platform",
    "trading bot",
    "gold trading",
    "XAUUSD",
    "stocks India",
    "NSE BSE",
    "mutual funds",
    "crypto trading",
    "forex",
    "algorithmic trading",
    "AI portfolio advisor",
    "Telegram trading",
  ],
  authors: [{ name: "XMOne" }],
  creator: "XMOne",
  publisher: "XMOne",
  alternates: {
    canonical: "https://xmbot.online",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://xmbot.online",
    siteName: "XMOne",
    title: "XMOne — AI Investment Platform",
    description:
      "AI-powered investment platform for gold, stocks, crypto, and mutual funds. Multi-agent AI finds opportunities across India and global markets.",
    images: [
      {
        url: "https://xmbot.online/og-image.png",
        width: 1200,
        height: 630,
        alt: "XMOne — AI Investment Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XMOne — AI Investment Platform",
    description:
      "AI-powered investment platform for gold, stocks, crypto, and mutual funds. You stay in control.",
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
  themeColor: "#FAFAF8",
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
    <html lang="en">
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
