export const chartTheme = {
  // Color palette matching our brand
  colors: {
    primary: '#8B5CF6',    // Purple (brand color)
    secondary: '#3B82F6',  // Blue
    success: '#10B981',    // Green
    warning: '#F59E0B',    // Yellow
    danger: '#EF4444',     // Red
    gray: '#6B7280'        // Gray
  },
  
  // Chart styling
  axis: {
    stroke: '#9CA3AF',
    fontSize: 12
  },
  
  grid: {
    stroke: '#374151',
    strokeDasharray: '3 3'
  },
  
  tooltip: {
    contentStyle: {
      backgroundColor: '#1F2937',
      border: '1px solid #374151',
      borderRadius: '0.5rem',
      padding: '0.75rem'
    },
    labelStyle: {
      color: '#9CA3AF',
      fontSize: '0.875rem'
    },
    itemStyle: {
      color: '#E5E7EB',
      fontSize: '0.875rem'
    }
  },
  
  legend: {
    itemStyle: {
      color: '#E5E7EB',
      fontSize: '0.875rem'
    }
  }
}

// Format currency for charts
export { formatCurrencyForCharts as formatCurrency } from '@/lib/utils/currency'

// Format percentage
export const formatPercentage = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`
}

// Get color for percentage change
export const getChangeColor = (value: number): string => {
  return value >= 0 ? chartTheme.colors.success : chartTheme.colors.danger
}