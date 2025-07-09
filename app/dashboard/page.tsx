import { StatCard } from "@/components/dashboard/StatCard"
import { ActivityTable } from "@/components/dashboard/ActivityTable"
import { Phone, Calendar, Clock, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your business today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Calls Today"
          value={24}
          description="8 appointments booked"
          icon={Phone}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Appointments Booked"
          value={142}
          description="This month"
          icon={Calendar}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Avg Response Time"
          value="2.3s"
          description="Last 7 days"
          icon={Clock}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title="Revenue Impact"
          value="$4,280"
          description="From booked appointments"
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      <ActivityTable />
    </>
  )
}