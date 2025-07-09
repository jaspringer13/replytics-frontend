import { Phone, Calendar, MessageSquare, Mic } from "lucide-react"

const features = [
  {
    icon: Phone,
    title: "24/7 Availability",
    description: "Never miss a call again. Your AI receptionist works around the clock.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Automatically books appointments based on your availability.",
  },
  {
    icon: MessageSquare,
    title: "SMS Reminders",
    description: "Reduce no-shows with automated text reminders to customers.",
  },
  {
    icon: Mic,
    title: "Natural Voice",
    description: "Sounds just like a real receptionist with natural conversation.",
  },
]

export function FeatureGrid() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl lg:text-4xl font-extrabold text-center mb-12">
          Everything You Need to Automate Your Reception
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}