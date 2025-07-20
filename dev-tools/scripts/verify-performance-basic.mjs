#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const METRICS_ENDPOINT = `${BASE_URL}/api/performance`;

console.log('🎯 REPLYTICS PERFORMANCE VERIFICATION');
console.log('=====================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Time: ${new Date().toISOString()}\n`);

async function checkEndpoint() {
  try {
    // Test POST endpoint
    console.log('1. Testing Performance API Endpoint...');
    
    const testMetric = {
      name: 'TEST_METRIC',
      value: 1234,
      rating: 'good',
      delta: 0,
      id: `test-${Date.now()}`,
      navigationType: 'navigate',
      entries: [],
    };

    const postResponse = await fetch(METRICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMetric),
    });

    if (!postResponse.ok) {
      throw new Error(`POST failed: ${postResponse.status}`);
    }

    const postResult = await postResponse.json();
    console.log('✅ POST endpoint working:', postResult);

    // Test GET endpoint
    const getResponse = await fetch(`${METRICS_ENDPOINT}?limit=5`);
    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status}`);
    }

    const getResult = await getResponse.json();
    console.log(`✅ GET endpoint working: Found ${getResult.data.total} metrics\n`);

    return true;
  } catch (error) {
    console.error('❌ API Endpoint Error:', error.message);
    return false;
  }
}

async function checkSmokeTestPage() {
  try {
    console.log('2. Checking Smoke Test Page...');
    
    const response = await fetch(`${BASE_URL}/performance-smoke-test`);
    if (!response.ok) {
      throw new Error(`Page load failed: ${response.status}`);
    }

    const html = await response.text();
    const hasTitle = html.includes('Performance Metrics Smoke Test');
    const hasComponents = html.includes('Large Content Paint Trigger') && 
                         html.includes('Cumulative Layout Shift Test');

    if (hasTitle && hasComponents) {
      console.log('✅ Smoke test page renders correctly\n');
      return true;
    } else {
      throw new Error('Page missing expected content');
    }
  } catch (error) {
    console.error('❌ Smoke Test Page Error:', error.message);
    return false;
  }
}

async function getRecentMetrics() {
  try {
    console.log('3. Fetching Recent Metrics...');
    
    const response = await fetch(`${METRICS_ENDPOINT}?limit=20`);
    const result = await response.json();
    
    if (result.success && result.data?.metrics?.length > 0) {
      console.log(`✅ Found ${result.data.metrics.length} recent metrics:`);
      
      const metricTypes = {};
      result.data.metrics.forEach(m => {
        metricTypes[m.metric.name] = (metricTypes[m.metric.name] || 0) + 1;
      });
      
      Object.entries(metricTypes).forEach(([name, count]) => {
        console.log(`   - ${name}: ${count} measurement(s)`);
      });
      console.log('');
      
      return true;
    } else {
      console.log('⚠️  No metrics found yet\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Error fetching metrics:', error.message);
    return false;
  }
}

async function main() {
  console.log('Starting verification...\n');
  
  const results = {
    apiEndpoint: await checkEndpoint(),
    smokeTestPage: await checkSmokeTestPage(),
    recentMetrics: await getRecentMetrics(),
  };

  console.log('SUMMARY');
  console.log('=======');
  const allPassed = Object.values(results).every(r => r);
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });

  if (allPassed) {
    console.log('\n🎉 All basic checks passed!');
    console.log('ℹ️  Note: For full browser testing, visit /performance-smoke-test manually');
    console.log('    and check the browser console for [PERFORMANCE METRIC] logs.');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks failed. Please review the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});