import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { HeroSection } from "@/components/marketing/HeroSection"
import { FeatureGrid } from "@/components/marketing/FeatureGrid"
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
      <HeroSection />
      <FeatureGrid />

      {/* Social Proof */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <p className="text-center text-gray-500 mb-8">Trusted by 1,000+ service businesses</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {["Bliss Hair Studio", "Ink Masters", "Tranquil Waters", "Elite Barber", "Nail Art"].map(
              (company) => (
                <div key={company} className="text-gray-400 font-semibold text-lg">
                  {company}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-text-secondary">
            Loved by Service Businesses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      <FAQAccordion />

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-hero text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of service businesses using Replytics to grow revenue and save time.
          </p>
          <Link href="/api/auth/signin">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}