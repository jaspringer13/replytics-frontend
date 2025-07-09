import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function SupportPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Support</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Input placeholder="How can we help?" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-md min-h-[150px]"
              placeholder="Describe your issue..."
            />
          </div>
          <Button type="submit">Send Message</Button>
        </form>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">How do I connect my calendar?</h3>
            <p className="text-sm text-gray-600">
              Go to Settings and click on the Calendar Integration section to connect your Google Calendar.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Can I change my phone number?</h3>
            <p className="text-sm text-gray-600">
              Yes, you can update your phone number in the Settings page under Business Information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}