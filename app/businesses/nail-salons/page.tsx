import { BusinessPageTemplate } from '@/components/businesses/BusinessPageTemplate'

export default function NailSalonsPage() {
  return (
    <BusinessPageTemplate
      title="AI Receptionist for Nail Salons"
      subtitle="Keep your hands free while we handle your calls"
      benefits={[
        'Book appointments for multiple technicians',
        'Handle group bookings effortlessly',
        'Manage special requests and preferences',
        'Send pre-appointment instructions',
        'Fill last-minute cancellations',
        'Answer pricing and service questions'
      ]}
      testimonial={{
        quote: "We no longer have to interrupt services to answer calls. Our clients love the professional experience, and we love the efficiency.",
        author: "Lisa, Owner of Luxe Nails & Spa"
      }}
    />
  )
}