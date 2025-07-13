const path = require('path');

// Clear the require cache and module paths
delete require.cache[require.resolve('../lib/testing/mock-data-generator.ts')];

// Mock TypeScript imports
require.extensions['.ts'] = require.extensions['.js'];

// Load the module
const { mockDataGenerator } = require('../lib/testing/mock-data-generator.ts');

console.log('Testing mock data generator...');

const data = mockDataGenerator.generateAllData({
  callCount: 10,
  smsCount: 5,
  bookingCount: 5
});

console.log('Calls generated:', data.calls.length);
console.log('SMS generated:', data.sms.length); 
console.log('Bookings generated:', data.bookings.length);

// Show sample data
if (data.calls.length > 0) {
  console.log('\nSample call:', {
    id: data.calls[0].id,
    customer: data.calls[0].customerName,
    status: data.calls[0].status,
    duration: data.calls[0].duration
  });
}

console.log('\nStats:', data.stats);