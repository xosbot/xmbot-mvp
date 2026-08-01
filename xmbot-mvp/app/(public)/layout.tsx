import { Navbar } from "@/components/layout/public-navbar"
import { PublicFooter } from "@/components/layout/public-footer"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold-500 focus:text-neutral-950 focus:top-4 focus:left-4"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">{children}</main>
      <PublicFooter />
    </>
  )
}
