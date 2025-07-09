import { formatDate, formatTime } from "@/lib/utils"

interface Activity {
  id: string
  type: "call" | "appointment" | "sms"
  customer: string
  phone: string
  status: "completed" | "scheduled" | "missed"
  date: Date
  duration?: number
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "call",
    customer: "John Doe",
    phone: "(555) 123-4567",
    status: "completed",
    date: new Date(),
    duration: 180,
  },
  {
    id: "2",
    type: "appointment",
    customer: "Jane Smith",
    phone: "(555) 987-6543",
    status: "scheduled",
    date: new Date(Date.now() + 86400000),
  },
  {
    id: "3",
    type: "sms",
    customer: "Bob Johnson",
    phone: "(555) 555-5555",
    status: "completed",
    date: new Date(Date.now() - 3600000),
  },
]

export function ActivityTable() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockActivities.map((activity) => (
              <tr key={activity.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {activity.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {activity.customer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      activity.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : activity.status === "scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {activity.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(activity.date)} at {formatTime(activity.date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}