import { Card, CardContent } from "@/components/ui/Card"
import { Quote } from "lucide-react"

interface TestimonialCardProps {
  name: string
  role: string
  content: string
}

export function TestimonialCard({ name, role, content }: TestimonialCardProps) {
  return (
    <Card className="h-full shadow-lg">
      <CardContent className="p-6">
        <Quote className="h-8 w-8 text-primary/20 mb-4" />
        <p className="text-gray-600 mb-6 italic">&ldquo;{content}&rdquo;</p>
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mr-4" />
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}