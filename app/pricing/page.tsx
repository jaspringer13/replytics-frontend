import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { PricingTable } from "@/components/marketing/PricingTable"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background-light">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-secondary">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your business. No hidden fees.
            </p>
          </div>
          <PricingTable />
        </div>
      </div>
      <Footer />
    </div>
  )
}