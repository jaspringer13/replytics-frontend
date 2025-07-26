#!/usr/bin/env node

// Test script to verify performance metrics are working
console.log('Testing performance metrics module...\n');

// Mock browser APIs for testing
global.window = {
  location: { href: 'http://localhost:3001/test' },
};
global.navigator = {
  userAgent: 'Test Browser',
  sendBeacon: (url, data) => {
    console.log('sendBeacon called with:', url, data);
    return true;
  },
};
global.performance = {
  timeOrigin: Date.now(),
  now: () => Date.now() - global.performance.timeOrigin,
};

// Import after mocking globals
const { getPerformanceTracker, markStatsLoaded } = await import('../../lib/performance/metrics.ts');

console.log('✅ Performance metrics module loaded successfully');
console.log('✅ Module exports available');

// Simulate usage
try {
  const tracker = getPerformanceTracker();
  console.log('✅ Performance tracker initialized');
  
  // Simulate marking stats loaded
  await new Promise((resolve) => {
    setTimeout(() => {
      markStatsLoaded();
      console.log('✅ Stats loaded marked successfully');
      console.log('\nPerformance metrics module is ready for use!');
      resolve(void 0);
    }, 100);
  });
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}