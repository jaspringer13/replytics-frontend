import { BusinessPageTemplate } from '@/components/businesses/BusinessPageTemplate'

export default function BeautySalonsPage() {
  return (
    <BusinessPageTemplate
      title="AI Receptionist for Beauty Salons"
      subtitle="Focus on your clients while we handle the phones"
      benefits={[
        'Multi-service appointment booking',
        'Stylist availability management',
        'Automated confirmations and reminders',
        'Waitlist management for cancellations',
        'Upsell additional services',
        'Handle product inquiries'
      ]}
      testimonial={{
        quote: "Our stylists can focus on clients instead of answering phones all day. We've increased bookings by 35% since using Replytics.",
        author: "Sarah, Manager at Bella's Beauty Studio"
      }}
    />
  )
}