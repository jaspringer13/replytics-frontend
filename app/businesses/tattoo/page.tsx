import { BusinessPageTemplate } from '@/components/businesses/BusinessPageTemplate'

export default function TattooStudiosPage() {
  return (
    <BusinessPageTemplate
      title="AI Receptionist for Tattoo Studios"
      subtitle="Focus on your art while we manage your consultations"
      benefits={[
        'Schedule consultations and appointments',
        'Collect design ideas and references',
        'Handle deposit payments and policies',
        'Send aftercare instructions automatically',
        'Manage artist availability and specialties',
        'Answer questions about pricing and process'
      ]}
      testimonial={{
        quote: "Replytics understands our unique booking needs. It handles consultations perfectly and even explains our deposit policy. Incredible!",
        author: "Jake, Artist at Iron & Ink Tattoo"
      }}
    />
  )
}