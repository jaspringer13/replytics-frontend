#!/usr/bin/env ts-node

/**
 * Test script to verify phone-specific settings transmission to backend
 * Tests the (256) 809-0055 phone number assigned to jaspringer13@gmail.com
 */

import { apiClient } from '../lib/api-client';

// Test configuration
const TEST_EMAIL = 'jaspringer13@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';
const TEST_PHONE_NUMBER = '+12568090055';
const TEST_PHONE_ID = 'test-phone-001';

interface TestResult {
  step: string;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

function logResult(step: string, success: boolean, data?: any, error?: string) {
  const result = { step, success, data, error };
  results.push(result);
  
  if (success) {
    console.log(`✅ ${step}`);
    if (data) console.log(`   Data:`, JSON.stringify(data, null, 2));
  } else {
    console.error(`❌ ${step}`);
    if (error) console.error(`   Error: ${error}`);
  }
  console.log('');
}

async function testPhoneSettings() {
  console.log('🧪 Testing Phone-Specific Settings Transmission');
  console.log('================================================\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const authResponse = await apiClient.login(TEST_EMAIL, TEST_PASSWORD);
    logResult('Login', true, {
      userId: authResponse.user.id,
      email: authResponse.user.email,
    });

    // Step 2: Get phone numbers for the business
    console.log('2️⃣ Fetching phone numbers...');
    const businessId = authResponse.user.id; // Assuming user ID is business ID
    const phoneNumbers = await apiClient.getPhoneNumbers();
    
    const testPhone = phoneNumbers.find(p => p.phoneNumber === TEST_PHONE_NUMBER);
    if (!testPhone) {
      throw new Error(`Test phone number ${TEST_PHONE_NUMBER} not found`);
    }
    
    logResult('Fetch Phone Numbers', true, {
      totalPhones: phoneNumbers.length,
      testPhone: {
        id: testPhone.id,
        phoneNumber: testPhone.phoneNumber,
        displayName: testPhone.displayName,
        isPrimary: testPhone.isPrimary,
      }
    });

    // Step 3: Get current voice settings
    console.log('3️⃣ Fetching current voice settings...');
    const currentVoiceSettings = await apiClient.getPhoneVoiceSettings(testPhone.id);
    logResult('Get Voice Settings', true, currentVoiceSettings);

    // Step 4: Update voice settings
    console.log('4️⃣ Updating voice settings...');
    const updatedVoiceSettings = await apiClient.updatePhoneVoiceSettings(testPhone.id, {
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Friendly Male
    });
    logResult('Update Voice Settings', true, updatedVoiceSettings);

    // Step 5: Get conversation rules
    console.log('5️⃣ Fetching conversation rules...');
    const conversationRules = await apiClient.getPhoneConversationRules(testPhone.id);
    logResult('Get Conversation Rules', true, conversationRules);

    // Step 6: Update conversation rules
    console.log('6️⃣ Updating conversation rules...');
    const updatedRules = await apiClient.updatePhoneConversationRules(testPhone.id, {
      allowMultipleServices: false,
      allowCancellations: true,
      allowRescheduling: true,
    });
    logResult('Update Conversation Rules', true, updatedRules);

    // Step 7: Get operating hours
    console.log('7️⃣ Fetching operating hours...');
    const operatingHours = await apiClient.getPhoneOperatingHours(testPhone.id);
    logResult('Get Operating Hours', true, {
      daysConfigured: operatingHours.length,
      hours: operatingHours,
    });

    // Step 8: Test WebSocket connection
    console.log('8️⃣ Testing WebSocket connection...');
    const ws = apiClient.createPhoneWebSocketConnection(testPhone.id);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      ws.addEventListener('open', () => {
        clearTimeout(timeout);
        logResult('WebSocket Connection', true, { status: 'connected' });
        ws.close();
        resolve();
      });

      ws.addEventListener('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Step 9: Verify settings persist
    console.log('9️⃣ Verifying settings persistence...');
    const verifyVoiceSettings = await apiClient.getPhoneVoiceSettings(testPhone.id);
    const settingsMatch = 
      verifyVoiceSettings.voiceId === updatedVoiceSettings.voiceId;
    
    logResult('Settings Persistence', settingsMatch, {
      persisted: settingsMatch,
      current: verifyVoiceSettings,
    });

  } catch (error) {
    logResult('Test Execution', false, null, error instanceof Error ? error.message : String(error));
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📈 Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
  
  if (failureCount > 0) {
    console.log('\n❌ Failed Steps:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.step}: ${r.error}`);
    });
  }
  
  // Exit with appropriate code
  process.exit(failureCount > 0 ? 1 : 0);
}

// Run the test
testPhoneSettings().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});