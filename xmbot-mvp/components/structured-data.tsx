export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "XMBot",
    url: "https://xmbot.app",
    logo: "https://xmbot.app/logo.svg",
    description: "AI-powered gold trading platform with human-in-the-loop approval",
    sameAs: [
      "https://x.com/xmbot",
      "https://t.me/xmbot",
    ],
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "XMBot",
    url: "https://xmbot.app",
    description: "AI-powered gold trading platform with human-in-the-loop approval",
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "XMBot Beta Access",
    description: "AI-powered gold trading platform with multi-agent system and human-in-the-loop approval",
    brand: {
      "@type": "Brand",
      name: "XMBot",
    },
    offers: {
      "@type": "Offer",
      price: "9999",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: "2026-01-01",
    },
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is my money safe?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "XMBot never has direct access to your funds. We connect via API keys with trading permissions only (no withdrawal). You can revoke access anytime. The 2% risk rule ensures no single trade can cause significant damage.",
        },
      },
      {
        "@type": "Question",
        name: "What is XMBot?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "XMBot is an AI-powered trading platform for gold (XAUUSD). It uses a multi-agent system to analyze the market 24/5 and sends trading signals to your Telegram. You approve or reject each trade — no auto-execution without your say.",
        },
      },
      {
        "@type": "Question",
        name: "How does the human-in-the-loop work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "When the AI identifies a trading opportunity, it sends a signal card to your Telegram with entry price, stop loss, take profit, and confidence score. You tap Approve or Reject. Only after your approval does the system execute the trade.",
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}
