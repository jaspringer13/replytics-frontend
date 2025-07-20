"use client"

import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { useAnalyticsDateRange, useAnalyticsLoading } from '@/contexts/AnalyticsContext';

export function AnalyticsHeader() {
  const { dateRange, setDateRange, validateDateRange } = useAnalyticsDateRange();
  const { refetch } = useAnalyticsLoading();

  const handleStartDateChange = (newStart: string) => {
    if (validateDateRange(newStart, dateRange.end)) {
      setDateRange({ ...dateRange, start: newStart });
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    if (validateDateRange(dateRange.start, newEnd)) {
      setDateRange({ ...dateRange, end: newEnd });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Track performance metrics and gain insights</p>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="bg-transparent text-white text-sm outline-none"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="bg-transparent text-white text-sm outline-none"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
    </div>
  );
}