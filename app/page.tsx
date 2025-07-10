import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { HeroSection } from "@/components/marketing/HeroSection"
import { FeatureGrid } from "@/components/marketing/FeatureGrid"
import { MemoryInAction } from "@/components/marketing/MemoryInAction"
import { TestimonialSection } from "@/components/marketing/TestimonialSection"
import { CTASection } from "@/components/marketing/CTASection"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <FeatureGrid />
        <MemoryInAction />
        <TestimonialSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}