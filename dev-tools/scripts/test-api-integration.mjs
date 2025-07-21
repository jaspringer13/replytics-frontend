#!/usr/bin/env node

// Test API integration with backend
// Run with: node scripts/test-api-integration.mjs

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
const businessId = process.env.TEST_BUSINESS_ID;
const token = process.env.TEST_API_TOKEN;

// Validate required environment variables
if (!businessId || !token) {
  console.error('❌ Missing required environment variables:');
  if (!businessId) console.error('  - TEST_BUSINESS_ID');
  if (!token) console.error('  - TEST_API_TOKEN');
  console.error('\nPlease set these variables before running the script.');
  process.exit(1);
}

console.log(`Testing API endpoints at: ${BACKEND_URL}`);

async function testEndpoint(path, method = 'GET', body = null) {
  console.log(`\n📍 Testing ${method} ${path}`);
  const startTime = Date.now();
  
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': businessId,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BACKEND_URL}${path}`, options);
    const duration = Date.now() - startTime;
    
    console.log(`Status: ${response.status} ${response.statusText} (${duration}ms)`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.error('❌ Request timed out after 30 seconds');
    } else {
      console.error('❌ Request failed:', error.message);
    }
  }
}

async function runTests() {
  console.log('🧪 Starting API integration tests...\n');
  
  // Test health check
  await testEndpoint('/health');
  
  // Test business profile
  await testEndpoint(`/api/v2/dashboard/business/profile?business_id=${businessId}`);
  
  // Test voice settings
  await testEndpoint('/api/v2/dashboard/business/voice-settings');
  
  // Test conversation rules
  await testEndpoint('/api/v2/dashboard/business/conversation-rules');
  
  // Test services
  await testEndpoint('/api/v2/dashboard/services');
  
  // Test business hours
  await testEndpoint('/api/v2/dashboard/hours');
  
  // Test analytics
  const today = new Date().toISOString().split('T')[0];
  await testEndpoint(`/api/v2/dashboard/analytics/overview?startDate=${today}&endDate=${today}`);
  
  console.log('\n✅ API integration tests complete');
}

runTests().catch(console.error);