"use client"

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useCustomers } from '@/hooks/useCustomers'
import { CustomerCard } from '@/components/dashboard/customers/CustomerCard'
import { CustomerDetailsDrawer } from '@/components/dashboard/customers/CustomerDetailsDrawer'
import { SegmentFilter } from '@/components/dashboard/customers/SegmentFilter'
import { Search, Filter, Download, UserPlus, RefreshCw } from 'lucide-react'
import { Customer, CustomerSegment } from '@/app/models/dashboard'
import { motion } from 'framer-motion'

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment['segment'] | 'all'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'value' | 'visits' | 'name'>('recent')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Fetch customers with filters
  const { 
    customers, 
    loading, 
    error, 
    totalCount, 
    hasMore, 
    refetch, 
    loadMore 
  } = useCustomers({
    search: searchQuery,
    segment: selectedSegment,
    sortBy
  })

  // Calculate segment counts
  const segmentCounts = useMemo(() => {
    // In a real app, this would come from the API
    // For now, we'll calculate from loaded customers
    const counts = {
      all: totalCount,
      vip: 0,
      regular: 0,
      at_risk: 0,
      new: 0,
      dormant: 0
    }

    customers.forEach(customer => {
      if (customer.segment && customer.segment in counts) {
        counts[customer.segment as keyof typeof counts]++
      }
    })

    return counts
  }, [customers, totalCount])

  // Handle customer selection
  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDrawerOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Customers</h1>
            <p className="text-gray-400">
              Manage and engage with your {totalCount} customers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 border border-gray-700">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="recent">Most Recent</option>
              <option value="value">Highest Value</option>
              <option value="visits">Most Visits</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* Segment Filters */}
          <SegmentFilter
            selectedSegment={selectedSegment}
            onSegmentChange={(segment) => setSelectedSegment(segment as any)}
            segmentCounts={segmentCounts}
          />
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {customers.length} of {totalCount} customers
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Customer Grid */}
        {loading && customers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-5 border border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Failed to load customers</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-brand-400 hover:text-brand-300"
            >
              Try again
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No customers found</h3>
            <p className="text-gray-400">
              {searchQuery 
                ? `No customers match "${searchQuery}"`
                : "Add your first customer to get started"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((customer, index) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onClick={handleCustomerClick}
                  delay={index * 0.05}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </motion.div>
            )}
          </>
        )}

        {/* Customer Details Drawer */}
        <CustomerDetailsDrawer
          customer={selectedCustomer}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedCustomer(null)
          }}
        />
      </div>
    </DashboardLayout>
  )
}