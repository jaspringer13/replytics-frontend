import { Button } from "@/components/ui/Button"

export default function BillingPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">Professional Plan</h3>
            <p className="text-gray-600">$99/month</p>
          </div>
          <Button variant="outline">Change Plan</Button>
        </div>
        <div className="text-sm text-gray-600">
          <p>Next billing date: January 1, 2025</p>
          <p>3 calendars connected</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium">Visa ending in 4242</p>
            <p className="text-sm text-gray-600">Expires 12/25</p>
          </div>
          <Button variant="outline">Update</Button>
        </div>
      </div>
    </div>
  )
}