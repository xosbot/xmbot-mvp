import { HeroSection } from "@/components/landing/hero-section"
import { MarketCoverageSection } from "@/components/landing/market-coverage-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ProofSection } from "@/components/landing/proof-section"
import { AIAgentsSection } from "@/components/landing/ai-agents-section"
import { LivePreviewSection } from "@/components/landing/live-preview-section"
import { InvestmentAdvisorySection } from "@/components/landing/investment-advisory-section"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { PricingCards } from "@/components/landing/pricing-cards"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarketCoverageSection />
      <HowItWorks />
      <ProofSection />
      <AIAgentsSection />
      <LivePreviewSection />
      <InvestmentAdvisorySection />
      <FeaturesGrid />
      <TestimonialsSection />
      <PricingCards />
      <FAQSection />
      <CTASection />
    </>
  )
}
