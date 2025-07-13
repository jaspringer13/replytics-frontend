'use client';

import { useState, useEffect } from 'react';
import { mockDataGenerator } from '@/lib/testing/mock-data-generator';

export default function TestMockDataPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate mock data on mount
    const generateData = () => {
      const startTime = performance.now();
      const mockData = mockDataGenerator.generateAllData({
        callCount: 1000,
        smsCount: 200,
        bookingCount: 500
      });
      const duration = performance.now() - startTime;

      setData({
        ...mockData,
        generationTime: duration
      });
      setLoading(false);
    };

    generateData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating mock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mock Data Generator Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Generation Performance</h2>
          <p className="text-gray-600">
            Generated {data.calls.length} calls, {data.sms.length} SMS messages, and{' '}
            {data.bookings.length} bookings in{' '}
            <span className="font-mono text-green-600">{data.generationTime.toFixed(2)}ms</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Calls"
            value={data.stats.totalCalls}
            subtitle={`${data.stats.missedCalls} missed`}
          />
          <StatCard
            title="Conversion Rate"
            value={`${(data.stats.conversionRate * 100).toFixed(1)}%`}
            subtitle="Calls → Bookings"
          />
          <StatCard
            title="Peak Hour"
            value={`${data.stats.peakHour}:00`}
            subtitle="Most busy time"
          />
          <StatCard
            title="Busiest Day"
            value={data.stats.busiestDay}
            subtitle="Most calls"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Calls</h3>
            <div className="space-y-3">
              {data.calls.slice(0, 5).map((call: any) => (
                <div key={call.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{call.customerName}</p>
                      <p className="text-sm text-gray-600">{call.phoneNumber}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      call.status === 'missed' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {call.status}
                    </span>
                  </div>
                  {call.summary && (
                    <p className="text-sm text-gray-500 mt-1">"{call.summary}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Duration: {call.duration}s
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent SMS</h3>
            <div className="space-y-3">
              {data.sms.slice(0, 5).map((sms: any) => (
                <div key={sms.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{sms.customerName}</p>
                    <span className={`text-xs ${
                      sms.direction === 'inbound' 
                        ? 'text-blue-600' 
                        : 'text-green-600'
                    }`}>
                      {sms.direction}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">"{sms.message}"</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Bookings</h3>
            <div className="space-y-3">
              {data.bookings
                .filter((b: any) => b.status !== 'cancelled')
                .slice(0, 5)
                .map((booking: any) => (
                  <div key={booking.id} className="border-b pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">{booking.service}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {booking.date} at {booking.time}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <h4 className="font-semibold mb-2">Mock Data Patterns:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Peak hours: 10am-12pm and 2pm-4pm</li>
            <li>Busy days: Friday and Saturday (50% more traffic)</li>
            <li>30% return customer rate</li>
            <li>15% missed call rate</li>
            <li>35% call-to-booking conversion</li>
            <li>14% booking cancellation rate</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}