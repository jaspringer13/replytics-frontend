import { BusinessPageTemplate } from '@/components/businesses/BusinessPageTemplate'

export default function MassageWellnessPage() {
  return (
    <BusinessPageTemplate
      title="AI Receptionist for Massage & Wellness"
      subtitle="Create a peaceful experience from the first call"
      benefits={[
        'Match clients with the right therapist',
        'Handle intake forms and preferences',
        'Book recurring appointments easily',
        'Manage multi-room scheduling',
        'Send pre-appointment preparations',
        'Coordinate package deals and memberships'
      ]}
      testimonial={{
        quote: "Our clients appreciate the calm, professional booking experience. We've reduced scheduling conflicts by 90% with Replytics.",
        author: "David, Director at Serenity Wellness Center"
      }}
    />
  )
}