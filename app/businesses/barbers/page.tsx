import { BusinessPageTemplate } from '@/components/businesses/BusinessPageTemplate'

export default function BarbersPage() {
  return (
    <BusinessPageTemplate
      title="AI Receptionist for Barbershops"
      subtitle="Never miss another walk-in while you're cutting hair"
      benefits={[
        'Handle multiple calls while you work',
        'Book appointments between cuts',
        'Manage waitlists automatically',
        'Send appointment reminders',
        'Capture walk-in information',
        'Answer questions about services and pricing'
      ]}
      testimonial={{
        quote: "Replytics handles all my calls while I'm with clients. My no-show rate dropped by 40% with automated reminders. Game changer!",
        author: "Mike, Owner of Mike's Barbershop"
      }}
    />
  )
}