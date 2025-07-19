#!/usr/bin/env node

console.log('✅ STEP 2 VERIFICATION: Mock Data Generators');
console.log('===========================================\n');

// Check if mock data generator exists
import { existsSync } from 'fs';
import { join } from 'path';

const mockDataPath = join(process.cwd(), 'lib/testing/mock-data-generator.ts');
if (existsSync(mockDataPath)) {
  console.log('✅ Mock data generator created at lib/testing/mock-data-generator.ts');
} else {
  console.error('❌ Mock data generator not found');
  process.exit(1);
}

// Test import
try {
  const { mockDataGenerator } = await import('../lib/testing/mock-data-generator.js');
  console.log('✅ Mock data generator imports successfully');
  
  // Quick functionality test
  const testData = mockDataGenerator.generateAllData({
    callCount: 100,
    smsCount: 50,
    bookingCount: 50
  });
  
  if (testData.calls.length > 0 && testData.sms.length > 0 && testData.bookings.length > 0) {
    console.log('✅ Mock data generator produces data successfully');
    console.log(`   Generated: ${testData.calls.length} calls, ${testData.sms.length} SMS, ${testData.bookings.length} bookings`);
    console.log(`   Note: Counts vary based on date distribution and busy day patterns`);
  } else {
    console.error('❌ Mock data generator failed to produce data');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to import mock data generator:', error.message);
  process.exit(1);
}

console.log('\n📊 Mock Data Features:');
console.log('- Realistic barber shop patterns (peak hours: 10-12, 2-4)');
console.log('- 30% return customer rate');
console.log('- 15% missed call rate');
console.log('- 35% call-to-booking conversion');
console.log('- 14% booking cancellation rate');
console.log('- Busy days: Friday & Saturday');
console.log('- Call durations: 45-180s (bookings), 20-60s (inquiries)');

console.log('\n🧪 Data Types Generated:');
console.log('- Calls with realistic durations and patterns');
console.log('- SMS conversations with templates');
console.log('- Bookings with various services and statuses');
console.log('- Customer names and phone numbers');

console.log('\n🎯 Usage Example:');
console.log(`
import { mockDataGenerator } from '@/lib/testing/mock-data-generator';

// Generate test data
const { calls, sms, bookings, stats } = mockDataGenerator.generateAllData({
  callCount: 1000,
  smsCount: 200, 
  bookingCount: 500
});

console.log(\`Peak hour: \${stats.peakHour}:00\`);
console.log(\`Busiest day: \${stats.busiestDay}\`);
`);

console.log('\n✅ VERIFICATION COMPLETE: Mock data generators ready!');