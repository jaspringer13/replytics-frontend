import { Button } from "@/components/ui/Button"
import { useBilling } from "@/hooks/api/useBilling"

export default function BillingPage() {
  const { data: billing, isLoading, error } = useBilling()
  
  if (isLoading) return <div className="p-6">Loading billing information...</div>
  if (error) return <div className="p-6 text-red-600">Error loading billing data</div>

  const planNames = {
    starter: 'Starter Plan',
    professional: 'Professional Plan', 
    enterprise: 'Enterprise Plan'
  }

  const planPrices = {
    starter: '$29',
    professional: '$99',
    enterprise: 'Custom'
  }

  const currentPlan = billing?.plan || 'starter'
  const nextBillingDate = billing?.billingPeriod?.end ? new Date(billing.billingPeriod.end).toLocaleDateString() : 'N/A'

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">{planNames[currentPlan as keyof typeof planNames]}</h3>
            <p className="text-gray-600">{planPrices[currentPlan as keyof typeof planPrices]}/month</p>
          </div>
          <Button variant="outline">Change Plan</Button>
        </div>
        <div className="text-sm text-gray-600">
          <p>Next billing date: {nextBillingDate}</p>
          <p>Days remaining: {billing?.daysRemaining || 0}</p>
        </div>
      </div>

      {/* Usage Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Usage This Month</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{billing?.usage?.calls || 0}</p>
            <p className="text-sm text-gray-600">Calls</p>
            <p className="text-xs text-gray-500">of {billing?.limits?.calls === -1 ? 'unlimited' : billing?.limits?.calls || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{billing?.usage?.minutes || 0}</p>
            <p className="text-sm text-gray-600">Minutes</p>
            <p className="text-xs text-gray-500">of {billing?.limits?.minutes === -1 ? 'unlimited' : billing?.limits?.minutes || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{billing?.usage?.sms || 0}</p>
            <p className="text-sm text-gray-600">SMS</p>
            <p className="text-xs text-gray-500">of {billing?.limits?.sms === -1 ? 'unlimited' : billing?.limits?.sms || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{billing?.usage?.recordings || 0}</p>
            <p className="text-sm text-gray-600">Recordings</p>
            <p className="text-xs text-gray-500">of {billing?.limits?.recordings === -1 ? 'unlimited' : billing?.limits?.recordings || 0}</p>
          </div>
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