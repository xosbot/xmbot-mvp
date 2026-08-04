import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ProofSection } from "@/components/landing/proof-section"
import { LivePreviewSection } from "@/components/landing/live-preview-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { PricingCards } from "@/components/landing/pricing-cards"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <ProofSection />
      <LivePreviewSection />
      <FeaturesGrid />
      <TestimonialsSection />
      <PricingCards />
      <FAQSection />
      <CTASection />
    </>
  )
}
