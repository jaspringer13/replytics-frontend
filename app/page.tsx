import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { HeroSection } from "@/components/marketing/HeroSection"
import { FeatureGrid } from "@/components/marketing/FeatureGrid"
import { SocialProof } from "@/components/marketing/SocialProof"
import { TestimonialCard } from "@/components/marketing/TestimonialCard"
import { FAQAccordion } from "@/components/marketing/FAQAccordion"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Owner, Bliss Hair Studio",
    content: "Replytics has transformed my business. I used to spend hours on the phone, now I can focus on my clients while never missing a booking.",
  },
  {
    name: "Mike Chen",
    role: "Tattoo Artist, Ink Masters",
    content: "The AI sounds so natural, my clients don't even realize they're not talking to a real person. It's incredible!",
  },
  {
    name: "Jessica Williams",
    role: "Spa Manager, Tranquil Waters",
    content: "We've seen a 40% reduction in no-shows since implementing SMS reminders. The ROI has been fantastic.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <FeatureGrid />
        <SocialProof />

        {/* Testimonials Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-center mb-12">
              Loved by Service Businesses
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>

        <FAQAccordion />

        {/* CTA Section */}
        <section className="py-20 lg:py-28 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-6 text-white">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl mb-10 text-gray-300 max-w-2xl mx-auto">
              Join thousands of service businesses using Replytics to grow revenue and save time.
            </p>
            <Link href="/api/auth/signin">
              <Button size="lg" className="h-12 px-8 text-lg bg-primary text-white hover:bg-primary/90">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}