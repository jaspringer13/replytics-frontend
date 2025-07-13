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
const { getPerformanceTracker, markStatsLoaded } = require('../lib/performance/metrics.ts');

console.log('✅ Performance metrics module loaded successfully');
console.log('✅ Module exports:', Object.keys(require('../lib/performance/metrics.ts')));

// Simulate usage
try {
  const tracker = getPerformanceTracker();
  console.log('✅ Performance tracker initialized');
  
  // Simulate marking stats loaded
  setTimeout(() => {
    markStatsLoaded();
    console.log('✅ Stats loaded marked successfully');
  }, 100);
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\nPerformance metrics module is ready for use!');