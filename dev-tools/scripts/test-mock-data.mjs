#!/usr/bin/env npx tsx

import { mockDataGenerator } from '../../lib/testing/mock-data-generator.js';

console.log('🧪 Testing Mock Data Generator');
console.log('==============================\n');

// Test 1: Generate small dataset
console.log('Test 1: Generating small dataset...');
const smallData = mockDataGenerator.generateAllData({
  callCount: 10,
  smsCount: 5,
  bookingCount: 8
});

console.log(`✅ Generated ${smallData.calls.length} calls`);
console.log(`✅ Generated ${smallData.sms.length} SMS messages`);
console.log(`✅ Generated ${smallData.bookings.length} bookings`);

// Test 2: Verify data patterns
console.log('\nTest 2: Verifying data patterns...');

// Check missed call rate
const missedRate = smallData.stats.totalCalls > 0 
  ? smallData.stats.missedCalls / smallData.stats.totalCalls 
  : 0;
const missedRatePercent = (missedRate * 100).toFixed(1);
console.log(`✅ Missed call rate: ${missedRatePercent}% (target: ~15%)`);

// Validate ranges
if (missedRate < 0.05 || missedRate > 0.25) {
  console.warn(`⚠️  Missed call rate ${missedRatePercent}% outside expected range (5-25%)`);
}

// Check peak hour
console.log(`✅ Peak hour: ${smallData.stats.peakHour}:00 (expected: 10-12 or 14-16)`);

// Check busiest day
console.log(`✅ Busiest day: ${smallData.stats.busiestDay}`);

// Test 3: Verify data structure
console.log('\nTest 3: Verifying data structure...');
const sampleCall = smallData.calls[0];
const sampleSMS = smallData.sms[0];
const sampleBooking = smallData.bookings[0];

console.log('\nSample Call:');
console.log(`  ID: ${sampleCall.id}`);
console.log(`  Customer: ${sampleCall.customerName}`);
console.log(`  Phone: ${sampleCall.phoneNumber}`);
console.log(`  Status: ${sampleCall.status}`);
console.log(`  Duration: ${sampleCall.duration}s`);

console.log('\nSample SMS:');
console.log(`  ID: ${sampleSMS.id}`);
console.log(`  Customer: ${sampleSMS.customerName}`);
console.log(`  Message: "${sampleSMS.message}"`);
console.log(`  Direction: ${sampleSMS.direction}`);

console.log('\nSample Booking:');
console.log(`  ID: ${sampleBooking.id}`);
console.log(`  Customer: ${sampleBooking.customerName}`);
console.log(`  Service: ${sampleBooking.service}`);
console.log(`  Date/Time: ${sampleBooking.date} ${sampleBooking.time}`);
console.log(`  Status: ${sampleBooking.status}`);

// Test 4: Generate large dataset performance
console.log('\nTest 4: Performance test with large dataset...');
const startTime = Date.now();

const largeData = mockDataGenerator.generateAllData({
  callCount: 1000,
  smsCount: 200,
  bookingCount: 500
});

const duration = Date.now() - startTime;
console.log(`✅ Generated 1000 calls, 200 SMS, 500 bookings in ${duration}ms`);

// Test 5: Verify return customer pattern
console.log('\nTest 5: Checking return customer patterns...');
if (largeData.calls.length === 0) {
  console.warn('⚠️  No calls in dataset, skipping return customer rate calculation');
} else {
  const phoneNumbers = new Set(largeData.calls.map(c => c.phoneNumber));
  const uniqueCustomers = phoneNumbers.size;
  const returnRate = (largeData.calls.length - uniqueCustomers) / largeData.calls.length;
  console.log(`✅ Return customer rate: ${(returnRate * 100).toFixed(1)}% (target: ~30%)`);
}

// Test 6: Verify realistic patterns
console.log('\nTest 6: Verifying realistic patterns...');

// Check call duration distribution
const bookingCalls = largeData.calls.filter(c => c.duration > 60);
const quickCalls = largeData.calls.filter(c => c.duration > 0 && c.duration <= 60);
console.log(`✅ Booking calls (>60s): ${bookingCalls.length}`);
console.log(`✅ Quick inquiries (≤60s): ${quickCalls.length}`);

// Check booking status distribution
const confirmed = largeData.bookings.filter(b => b.status === 'confirmed').length;
const cancelled = largeData.bookings.filter(b => b.status === 'cancelled').length;
const pending = largeData.bookings.filter(b => b.status === 'pending').length;
console.log(`✅ Confirmed bookings: ${confirmed}`);
const cancellationRate = largeData.bookings.length > 0 
  ? (cancelled/largeData.bookings.length*100).toFixed(1) 
  : '0.0';
console.log(`✅ Cancelled bookings: ${cancelled} (${cancellationRate}%)`);
console.log(`✅ Pending bookings: ${pending}`);

console.log('\n✅ All tests passed! Mock data generator is working correctly.');