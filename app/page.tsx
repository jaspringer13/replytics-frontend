import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { HeroSection } from "@/components/marketing/HeroSection"
import { FeatureGrid } from "@/components/marketing/FeatureGrid"
import { SocialProof } from "@/components/marketing/SocialProof"
import { TestimonialsSection } from "@/components/marketing/TestimonialCard"
import { FAQAccordion } from "@/components/marketing/FAQAccordion"
import { CTASection } from "@/components/marketing/CTASection"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <FeatureGrid />
        <SocialProof />

        <TestimonialsSection />

        <FAQAccordion />

        <CTASection 
          title="Ready to Transform Your Business?"
          subtitle="Join thousands of service businesses using Replytics to grow revenue and save time."
          primaryButtonText="Start Your Free Trial"
          primaryButtonHref="/api/auth/signin"
          secondaryButtonText="Schedule a Demo"
          secondaryButtonHref="/contact"
          features={["Setup in 5 minutes", "No technical skills required", "Free 14-day trial"]}
          variant="gradient"
        />
      </main>
      <Footer />
    </div>
  )
}