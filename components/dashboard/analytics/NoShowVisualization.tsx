/**
 * No-Show Visualization Component
 * Extracted from admin Metrics component - shows bookings vs no-shows trend
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface NoShowData {
  date: string;
  bookings: number;
  noShows: number;
  showRate: number; // Percentage of customers who showed up
}

interface NoShowVisualizationProps {
  data: NoShowData[];
  dateRange?: string;
}

export function NoShowVisualization({ data, dateRange = 'Last 30 Days' }: NoShowVisualizationProps) {
  // Calculate summary statistics
  const totalBookings = data.reduce((sum, day) => sum + day.bookings, 0);
  const totalNoShows = data.reduce((sum, day) => sum + day.noShows, 0);
  const overallShowRate = totalBookings > 0 ? ((totalBookings - totalNoShows) / totalBookings * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings vs No-Shows</CardTitle>
        <CardDescription>
          {dateRange} • {overallShowRate}% Show Rate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '14px' 
                }}
              />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Total Bookings"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="noShows" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="No-Shows"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Additional insights */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Bookings</p>
            <p className="text-lg font-semibold">{totalBookings}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total No-Shows</p>
            <p className="text-lg font-semibold text-destructive">{totalNoShows}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Show Rate</p>
            <p className="text-lg font-semibold text-primary">{overallShowRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to transform raw appointment data into no-show visualization data
 */
export function useNoShowData(appointments: any[], dateRange: { start: Date; end: Date }) {
  return React.useMemo(() => {
    // Group appointments by date
    const groupedByDate = appointments.reduce((acc, apt) => {
      const date = new Date(apt.scheduled_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { bookings: 0, noShows: 0, attended: 0 };
      }
      acc[date].bookings++;
      if (apt.status === 'no_show') {
        acc[date].noShows++;
      } else if (apt.status === 'completed') {
        acc[date].attended++;
      }
      return acc;
    }, {} as Record<string, { bookings: number; noShows: number; attended: number }>);

    // Convert to array format for chart
    return Object.entries(groupedByDate).map(([date, stats]) => {
      const typedStats = stats as { bookings: number; noShows: number; attended: number };
      return {
        date,
        bookings: typedStats.bookings,
        noShows: typedStats.noShows,
        showRate: typedStats.bookings > 0 ? ((typedStats.attended / typedStats.bookings) * 100) : 0
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);
}