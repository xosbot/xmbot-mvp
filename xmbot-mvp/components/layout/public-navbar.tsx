"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Terminal } from "lucide-react"

const navLinks = [
  { label: "Product", href: "/product" },
  { label: "AI Agents", href: "/product/ai-agents" },
  { label: "Investing", href: "/product/investing" },
  { label: "Integrations", href: "/product/integrations" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [mobileOpen])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className={`flex items-center justify-between transition-all duration-500 ${
          scrolled ? "h-16" : "h-20"
        }`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="corner-frame w-9 h-9 rounded-md border border-gold-500/30 bg-gold-500/5 flex items-center justify-center group-hover:border-gold-500/60 transition-colors duration-200">
              <Terminal className="h-4 w-4 text-gold-600" />
            </div>
            <span className="text-lg font-bold tracking-aggressive">
              <span className="text-foreground">XM</span>
              <span className="text-gold-600">One</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gold-600 hover:bg-gold-500 text-white font-semibold transition-colors duration-200 shadow-sm shadow-gold-600/20">
                Start Free
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className={`md:hidden bg-white/95 backdrop-blur-xl border-b border-border transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 border-b-0"
        }`}
        role="region"
        aria-label="Mobile navigation"
      >
        <div className="px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 space-y-2">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-gold-600 hover:bg-gold-500 text-white font-semibold shadow-sm shadow-gold-600/20">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
