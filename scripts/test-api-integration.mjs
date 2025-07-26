#!/usr/bin/env node

// Test API integration with backend
// Run with: node scripts/test-api-integration.mjs

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
const businessId = 'test-business-id';
const token = 'test-token'; // Replace with actual token

console.log(`Testing API endpoints at: ${BACKEND_URL}`);

async function testEndpoint(path, method = 'GET', body = null) {
  console.log(`\n📍 Testing ${method} ${path}`);
  
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': businessId,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BACKEND_URL}${path}`, options);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
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