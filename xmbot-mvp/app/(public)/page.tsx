import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ProofSection } from "@/components/landing/proof-section"
import { SocialProof } from "@/components/landing/social-proof"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { PricingCards } from "@/components/landing/pricing-cards"
import { CTASection } from "@/components/landing/cta-section"
import { FAQSection } from "@/components/landing/faq-section"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <ProofSection />
      <FeaturesGrid />
      <SocialProof />
      <PricingCards />
      <FAQSection />
      <CTASection />
    </>
  )
}
