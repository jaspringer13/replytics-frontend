'use client';

import { useStats } from '@/hooks/api/useStats';
import { useCalls } from '@/hooks/api/useCalls';
import { useBookings } from '@/hooks/api/useBookings';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

export default function TestReactQueryPage() {
  const { toast } = useToast();
  const { token, tenantId } = useAuth();
  
  // Test stats hook
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useStats();
  
  // Test calls hook with pagination
  const {
    data: callsData,
    isLoading: callsLoading,
    error: callsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCalls();
  
  // Test bookings hook
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    error: bookingsError,
  } = useBookings();
  
  // Test connection status
  const {
    status: connectionStatus,
    lastSyncTime,
    isTokenRefreshing,
    retry: retryConnection,
  } = useConnectionStatus();

  // Test toast notifications
  const testToasts = () => {
    toast.success('Success toast test', 'This is a success message');
    setTimeout(() => {
      toast.error('Error toast test', 'This is an error message');
    }, 1000);
    setTimeout(() => {
      toast.warning('Warning toast test', 'This is a warning message');
    }, 2000);
    setTimeout(() => {
      toast.info('Info toast test', 'This is an info message');
    }, 3000);
  };

  // Test 401 error handling
  const trigger401Error = async () => {
    try {
      // Clear the token to trigger a 401
      localStorage.removeItem('auth_token');
      await refetchStats();
    } catch (error) {
      console.error('401 test error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">React Query Integration Test</h1>
      
      {/* Auth Status */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Auth Status</h2>
        <p>Token: {token ? `${token.substring(0, 20)}...` : 'No token'}</p>
        <p>Tenant ID: {tenantId || 'No tenant ID'}</p>
      </div>

      {/* Connection Status */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p>Status: <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>{connectionStatus}</span></p>
        <p>Token Refreshing: {isTokenRefreshing ? 'Yes' : 'No'}</p>
        <p>Last Sync: {lastSyncTime?.toLocaleTimeString() || 'Never'}</p>
        <button
          onClick={retryConnection}
          className="mt-2 px-4 py-2 bg-brand-500 rounded hover:bg-brand-600"
        >
          Retry Connection
        </button>
      </div>

      {/* Stats Test */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Dashboard Stats</h2>
        {statsLoading && <p className="text-yellow-400">Loading stats...</p>}
        {statsError && <p className="text-red-400">Error: {statsError.message}</p>}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-gray-400">Total Calls</p>
              <p className="text-2xl">{stats.totalCalls}</p>
            </div>
            <div>
              <p className="text-gray-400">Calls Today</p>
              <p className="text-2xl">{stats.callsToday}</p>
            </div>
            <div>
              <p className="text-gray-400">Bookings Today</p>
              <p className="text-2xl">{stats.bookingsToday}</p>
            </div>
            <div>
              <p className="text-gray-400">SMS Today</p>
              <p className="text-2xl">{stats.smsToday}</p>
            </div>
            <div>
              <p className="text-gray-400">Answer Rate</p>
              <p className="text-2xl">{stats.answerRate.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-gray-400">Avg Call Duration</p>
              <p className="text-2xl">{stats.avgCallDuration}s</p>
            </div>
          </div>
        )}
        <button
          onClick={() => refetchStats()}
          className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Refetch Stats
        </button>
      </div>

      {/* Calls Test */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Calls (Infinite Scroll)</h2>
        {callsLoading && <p className="text-yellow-400">Loading calls...</p>}
        {callsError && <p className="text-red-400">Error: {callsError.message}</p>}
        {callsData && (
          <>
            <p className="mb-2">Total calls loaded: {callsData.pages.flatMap(p => p.calls).length}</p>
            <div className="max-h-60 overflow-y-auto border border-gray-700 rounded p-2">
              {callsData.pages.flatMap(page => page.calls).map((call) => (
                <div key={call.id} className="mb-2 p-2 bg-gray-700 rounded">
                  <p>{call.customerName || call.phoneNumber} - {call.status}</p>
                  <p className="text-sm text-gray-400">{new Date(call.startTime).toLocaleString()}</p>
                </div>
              ))}
            </div>
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-2 px-4 py-2 bg-green-500 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Loading more...' : 'Load More Calls'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Bookings Test */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Bookings</h2>
        {bookingsLoading && <p className="text-yellow-400">Loading bookings...</p>}
        {bookingsError && <p className="text-red-400">Error: {bookingsError.message}</p>}
        {bookingsData && (
          <>
            <p className="mb-2">Total bookings: {bookingsData.total}</p>
            <div className="max-h-40 overflow-y-auto border border-gray-700 rounded p-2">
              {bookingsData.bookings.map((booking) => (
                <div key={booking.id} className="mb-2 p-2 bg-gray-700 rounded">
                  <p>{booking.customerName} - {booking.service}</p>
                  <p className="text-sm text-gray-400">{booking.date} at {booking.time}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Test Actions */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        <div className="space-x-4">
          <button
            onClick={testToasts}
            className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600"
          >
            Test All Toasts
          </button>
          <button
            onClick={trigger401Error}
            className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
          >
            Trigger 401 Error
          </button>
        </div>
      </div>

      {/* React Query DevTools Note */}
      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-blue-400">
          💡 Open React Query DevTools (bottom right corner) to inspect cache, queries, and mutations
        </p>
      </div>
    </div>
  );
}