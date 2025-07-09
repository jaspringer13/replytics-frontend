"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function SettingsPage() {
  const [hours, setHours] = useState({
    monday: { open: "09:00", close: "17:00" },
    tuesday: { open: "09:00", close: "17:00" },
    wednesday: { open: "09:00", close: "17:00" },
    thursday: { open: "09:00", close: "17:00" },
    friday: { open: "09:00", close: "17:00" },
    saturday: { open: "10:00", close: "14:00" },
    sunday: { open: "closed", close: "closed" },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Business Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Business Name</label>
            <Input defaultValue="Sample Business" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <Input defaultValue="(555) 123-4567" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Business Hours</h2>
        <div className="space-y-3">
          {Object.entries(hours).map(([day, times]) => (
            <div key={day} className="grid grid-cols-3 gap-4 items-center">
              <label className="capitalize">{day}</label>
              <Input
                type="time"
                value={times.open}
                onChange={(e) => setHours({ ...hours, [day]: { ...times, open: e.target.value } })}
              />
              <Input
                type="time"
                value={times.close}
                onChange={(e) => setHours({ ...hours, [day]: { ...times, close: e.target.value } })}
              />
            </div>
          ))}
        </div>
        <Button className="mt-6">Save Changes</Button>
      </div>
    </div>
  )
}