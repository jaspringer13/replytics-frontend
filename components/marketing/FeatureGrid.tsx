import { Phone, Calendar, MessageSquare, Mic } from "lucide-react"

const features = [
  {
    icon: Phone,
    title: "24/7 Availability",
    description: "Never miss a call again. Your AI receptionist works around the clock, even on holidays.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Automatically books appointments based on your availability and business rules.",
  },
  {
    icon: MessageSquare,
    title: "SMS Reminders",
    description: "Reduce no-shows with automated text reminders sent to your customers.",
  },
  {
    icon: Mic,
    title: "Natural Voice",
    description: "Sounds just like a real receptionist with natural conversation flow.",
  },
]

export function FeatureGrid() {
  return (
    <section className="py-20 px-4 bg-background-light">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-text-secondary">
          Everything You Need to Automate Your Reception
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
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