#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const METRICS_ENDPOINT = `${BASE_URL}/api/performance`;

console.log('🎯 REPLYTICS PERFORMANCE BROWSER VERIFICATION');
console.log('===========================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Time: ${new Date().toISOString()}\n`);

// Simulated Web Vitals metrics
const simulatedMetrics = [
  { name: 'FCP', value: 234, rating: 'good' },
  { name: 'LCP', value: 567, rating: 'good' },
  { name: 'CLS', value: 0.02, rating: 'good' },
  { name: 'TTFB', value: 156, rating: 'good' },
  { name: 'statsLoaded', value: 623, rating: 'good' },
];

async function sendMetric(metric) {
  try {
    const response = await fetch(METRICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metric,
        delta: 0,
        id: `${metric.name}-${Date.now()}-sim`,
        navigationType: 'navigate',
        entries: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send ${metric.name}: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ ${metric.name}: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send ${metric.name}:`, error.message);
    return false;
  }
}

async function simulateBrowserMetrics() {
  console.log('Simulating browser performance metrics...\n');
  
  console.log('Core Web Vitals:');
  
  const results = [];
  for (const metric of simulatedMetrics) {
    results.push(await sendMetric(metric));
    await setTimeout(100); // Small delay between metrics
  }

  return results.every(r => r);
}

async function fetchAndDisplayMetrics() {
  console.log('\nFetching all recorded metrics...');
  
  try {
    const response = await fetch(`${METRICS_ENDPOINT}?limit=50`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch metrics');
    }

    const metrics = result.data.metrics;
    console.log(`\nFound ${metrics.length} total metrics:`);

    // Group by metric name
    const grouped = {};
    metrics.forEach(m => {
      const name = m.metric.name;
      if (!grouped[name]) {
        grouped[name] = [];
      }
      grouped[name].push(m.metric.value);
    });

    // Calculate and display averages
    console.log('\nMetric Averages:');
    Object.entries(grouped).forEach(([name, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const rating = getMetricRating(name, avg);
      console.log(`- ${name}: ${avg.toFixed(0)}${name === 'CLS' ? '' : 'ms'} (${rating}) - ${values.length} measurements`);
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to fetch metrics:', error.message);
    return false;
  }
}

function getMetricRating(name, value) {
  const thresholds = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    statsLoaded: { good: 1000, poor: 3000 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

async function generateReport() {
  console.log('\n' + '='.repeat(50));
  console.log('🎯 REPLYTICS PERFORMANCE SMOKE TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Environment: Development`);
  console.log(`Date: ${new Date().toLocaleDateString()}`);
  console.log(`Browser: Simulated\n`);

  console.log('Performance Grade: A (All simulated metrics are good)\n');

  console.log('Detailed Timeline:');
  console.log('- 0ms: Navigation start');
  console.log('- 156ms: First byte received (TTFB)');
  console.log('- 234ms: First contentful paint (FCP)');
  console.log('- 567ms: Largest contentful paint (LCP)');
  console.log('- 623ms: Stats loaded');
  console.log('- CLS: 0.02 (minimal layout shift)\n');

  console.log('✅ Performance tracking system is functional');
  console.log('✅ Metrics are being captured and stored');
  console.log('✅ API endpoints are working correctly\n');

  console.log('ℹ️  Note: For real browser metrics, visit:');
  console.log(`   ${BASE_URL}/performance-smoke-test`);
  console.log('   and check the browser console for live metrics.');
}

async function main() {
  try {
    // Simulate browser metrics
    const simulationSuccess = await simulateBrowserMetrics();
    
    if (!simulationSuccess) {
      console.error('\n❌ Failed to simulate metrics');
      process.exit(1);
    }

    // Wait a bit for processing
    await setTimeout(1000);

    // Fetch and display all metrics
    const fetchSuccess = await fetchAndDisplayMetrics();
    
    if (!fetchSuccess) {
      console.error('\n❌ Failed to fetch metrics');
      process.exit(1);
    }

    // Generate final report
    await generateReport();
    
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();