import { ActivityTable } from "@/components/dashboard/ActivityTable"

export default function CallsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Call History</h1>
      <ActivityTable />
    </div>
  )
}