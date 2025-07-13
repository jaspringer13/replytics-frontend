/**
 * Verification tests for error type guards (STEP 1.2)
 * Tests type guards, composite guards, and edge cases
 */

import * as guards from '@/lib/errors/guards';
import * as errors from '@/lib/errors/types';

// Test helper to verify guard behavior
function testGuard(
  guardName: string,
  guard: (value: unknown) => boolean,
  validInstance: any,
  expectedTrue: unknown[] = [],
  expectedFalse: unknown[] = []
): void {
  console.log(`Testing ${guardName}...`);
  
  // Test with valid instance
  if (!guard(validInstance)) {
    throw new Error(`${guardName} should return true for ${validInstance.constructor.name}`);
  }
  
  // Test additional true cases
  for (const testCase of expectedTrue) {
    if (!guard(testCase)) {
      throw new Error(`${guardName} should return true for test case`);
    }
  }
  
  // Test false cases
  const falseCases = [
    null,
    undefined,
    'string',
    123,
    true,
    {},
    [],
    new Error('plain error'),
    ...expectedFalse
  ];
  
  for (const testCase of falseCases) {
    if (guard(testCase)) {
      throw new Error(`${guardName} should return false for ${typeof testCase} value`);
    }
  }
  
  console.log(`✓ ${guardName} verified`);
}

// Main test function
export function runGuardTests(): void {
  console.log('=== STEP 1.2: Error Type Guards Verification ===\n');
  
  try {
    // Test 1: Basic type guards
    console.log('1. Testing Basic Type Guards:');
    
    testGuard('isAppError', guards.isAppError, new errors.NetworkError('test', 'TEST'));
    testGuard('isNetworkError', guards.isNetworkError, new errors.TimeoutError(5000));
    testGuard('isTimeoutError', guards.isTimeoutError, new errors.TimeoutError(5000));
    testGuard('isOfflineError', guards.isOfflineError, new errors.OfflineError());
    testGuard('isDNSError', guards.isDNSError, new errors.DNSError('example.com'));
    
    // Test 2: API error guards
    console.log('\n2. Testing API Error Guards:');
    
    testGuard('isAPIError', guards.isAPIError, new errors.ValidationError('test'));
    testGuard('isValidationError', guards.isValidationError, new errors.ValidationError('test'));
    testGuard('isAuthenticationError', guards.isAuthenticationError, new errors.AuthenticationError());
    testGuard('isAuthorizationError', guards.isAuthorizationError, new errors.AuthorizationError());
    testGuard('isNotFoundError', guards.isNotFoundError, new errors.NotFoundError());
    testGuard('isRateLimitError', guards.isRateLimitError, new errors.RateLimitError(60));
    testGuard('isServerError', guards.isServerError, new errors.ServerError());
    testGuard('isBusinessLogicError', guards.isBusinessLogicError, new errors.BusinessLogicError('test', 'CODE'));
    
    // Test 3: Voice call error guards (CRITICAL)
    console.log('\n3. Testing Voice Call Error Guards (CRITICAL):');
    
    const callState = {
      callId: 'call_123',
      phoneNumber: '+1234567890',
      duration: 120,
      isActive: true,
    };
    
    testGuard('isVoiceCallError', guards.isVoiceCallError, new errors.CallDroppedError('network', callState));
    testGuard('isCallDroppedError', guards.isCallDroppedError, new errors.CallDroppedError('network'));
    testGuard('isAudioQualityError', guards.isAudioQualityError, new errors.AudioQualityError());
    testGuard('isTranscriptionError', guards.isTranscriptionError, new errors.TranscriptionError('deepgram'));
    testGuard('isTwilioWebhookError', guards.isTwilioWebhookError, new errors.TwilioWebhookError('status'));
    
    // Test 4: Other error category guards
    console.log('\n4. Testing Other Error Category Guards:');
    
    testGuard('isCalendarError', guards.isCalendarError, new errors.GoogleAuthError());
    testGuard('isMessagingError', guards.isMessagingError, new errors.SMSDeliveryError());
    testGuard('isUIError', guards.isUIError, new errors.RenderError());
    testGuard('isIntegrationError', guards.isIntegrationError, new errors.WebSocketError());
    
    // Test 5: Composite guards
    console.log('\n5. Testing Composite Guards:');
    
    // Test isNetworkRelated
    const networkError = new errors.TimeoutError(5000);
    const wsError = new errors.WebSocketError();
    const nonNetworkError = new errors.ValidationError('test');
    
    if (!guards.isNetworkRelated(networkError)) {
      throw new Error('isNetworkRelated should return true for NetworkError');
    }
    if (!guards.isNetworkRelated(wsError)) {
      throw new Error('isNetworkRelated should return true for WebSocketError');
    }
    if (guards.isNetworkRelated(nonNetworkError)) {
      throw new Error('isNetworkRelated should return false for non-network errors');
    }
    console.log('✓ isNetworkRelated verified');
    
    // Test isAuthRelated
    const authError = new errors.AuthenticationError();
    const authzError = new errors.AuthorizationError();
    const googleError = new errors.GoogleAuthError();
    const nonAuthError = new errors.ServerError();
    
    if (!guards.isAuthRelated(authError) || !guards.isAuthRelated(authzError) || !guards.isAuthRelated(googleError)) {
      throw new Error('isAuthRelated should return true for auth errors');
    }
    if (guards.isAuthRelated(nonAuthError)) {
      throw new Error('isAuthRelated should return false for non-auth errors');
    }
    console.log('✓ isAuthRelated verified');
    
    // Test isRetryable
    const retryableErrors = [
      new errors.TimeoutError(5000),
      new errors.ServerError(),
      new errors.NetworkError('test', 'TEST'),
      new errors.RateLimitError(60), // Has retryAfter
    ];
    
    for (const err of retryableErrors) {
      if (!guards.isRetryable(err)) {
        throw new Error(`isRetryable should return true for ${err.constructor.name}`);
      }
    }
    
    const nonRetryableErrors = [
      new errors.ValidationError('test'),
      new errors.AuthorizationError(),
      new errors.RateLimitError(), // No retryAfter
    ];
    
    for (const err of nonRetryableErrors) {
      if (guards.isRetryable(err)) {
        throw new Error(`isRetryable should return false for ${err.constructor.name} without retry info`);
      }
    }
    console.log('✓ isRetryable verified');
    
    // Test 6: Special guards
    console.log('\n6. Testing Special Guards:');
    
    // Test isCallCritical
    const activeCallError = new errors.CallDroppedError('network', {
      callId: 'call_123',
      phoneNumber: '+1234567890',
      duration: 120,
      isActive: true,
    });
    
    const inactiveCallError = new errors.CallDroppedError('network', {
      callId: 'call_123',
      phoneNumber: '+1234567890',
      duration: 120,
      isActive: false,
    });
    
    const noStateCallError = new errors.CallDroppedError('network');
    
    if (!guards.isCallCritical(activeCallError)) {
      throw new Error('isCallCritical should return true for active call');
    }
    if (guards.isCallCritical(inactiveCallError)) {
      throw new Error('isCallCritical should return false for inactive call');
    }
    if (guards.isCallCritical(noStateCallError)) {
      throw new Error('isCallCritical should return false for no call state');
    }
    console.log('✓ isCallCritical verified');
    
    // Test requiresUserAction
    const userActionErrors = [
      new errors.AuthenticationError(),
      new errors.ValidationError('test'),
      new errors.BookingConflictError(),
      new errors.PaymentError('stripe', 'declined'),
    ];
    
    for (const err of userActionErrors) {
      if (!guards.requiresUserAction(err)) {
        throw new Error(`requiresUserAction should return true for ${err.constructor.name}`);
      }
    }
    
    if (guards.requiresUserAction(new errors.ServerError())) {
      throw new Error('requiresUserAction should return false for ServerError');
    }
    console.log('✓ requiresUserAction verified');
    
    // Test 7: Type narrowing guards
    console.log('\n7. Testing Type Narrowing Guards:');
    
    // Test hasStatusCode
    const errorWithCode = new errors.ServerError('test', 500);
    const errorWithoutCode = new errors.NetworkError('test', 'TEST');
    
    if (!guards.hasStatusCode(errorWithCode)) {
      throw new Error('hasStatusCode should return true for API errors with status');
    }
    if (guards.hasStatusCode(errorWithoutCode)) {
      throw new Error('hasStatusCode should return false for non-API errors');
    }
    console.log('✓ hasStatusCode verified');
    
    // Test hasRetryInfo
    const rateLimitWithRetry = new errors.RateLimitError(60);
    const rateLimitWithoutRetry = new errors.RateLimitError();
    
    if (!guards.hasRetryInfo(rateLimitWithRetry)) {
      throw new Error('hasRetryInfo should return true when retryAfter is present');
    }
    if (guards.hasRetryInfo(rateLimitWithoutRetry)) {
      throw new Error('hasRetryInfo should return false when retryAfter is missing');
    }
    console.log('✓ hasRetryInfo verified');
    
    // Test hasCallState
    if (!guards.hasCallState(activeCallError)) {
      throw new Error('hasCallState should return true for error with call state');
    }
    if (guards.hasCallState(noStateCallError)) {
      throw new Error('hasCallState should return false for error without call state');
    }
    console.log('✓ hasCallState verified');
    
    // Test 8: Edge cases
    console.log('\n8. Testing Edge Cases:');
    
    // Test isPlainError
    const plainError = new Error('plain');
    const appError = new errors.NetworkError('app', 'TEST');
    
    if (!guards.isPlainError(plainError)) {
      throw new Error('isPlainError should return true for plain Error');
    }
    if (guards.isPlainError(appError)) {
      throw new Error('isPlainError should return false for AppError');
    }
    console.log('✓ isPlainError verified');
    
    // Test isErrorLike
    const errorLike = { message: 'test', name: 'TestError', stack: 'stack trace' };
    const notErrorLike = { message: 123 }; // Wrong type
    const partialErrorLike = { message: 'test' }; // Valid partial
    
    if (!guards.isErrorLike(errorLike)) {
      throw new Error('isErrorLike should return true for error-like object');
    }
    if (!guards.isErrorLike(partialErrorLike)) {
      throw new Error('isErrorLike should return true for partial error-like object');
    }
    if (guards.isErrorLike(notErrorLike)) {
      throw new Error('isErrorLike should return false for non-error-like object');
    }
    console.log('✓ isErrorLike verified');
    
    // Test isAxiosError
    const axiosError = { isAxiosError: true, response: { status: 404, data: {} } };
    const fakeAxiosError = { isAxiosError: 'true' }; // Wrong type
    
    if (!guards.isAxiosError(axiosError)) {
      throw new Error('isAxiosError should return true for axios error');
    }
    if (guards.isAxiosError(fakeAxiosError)) {
      throw new Error('isAxiosError should return false for fake axios error');
    }
    console.log('✓ isAxiosError verified');
    
    // Test with null and undefined
    const nullUndefinedGuards = [
      guards.isAppError,
      guards.isNetworkRelated,
      guards.isAuthRelated,
      guards.isCallCritical,
      guards.requiresUserAction,
    ];
    
    for (const guard of nullUndefinedGuards) {
      if (guard(null) || guard(undefined)) {
        throw new Error(`Guard ${guard.name} should handle null/undefined`);
      }
    }
    console.log('✓ All guards handle null/undefined correctly');
    
    console.log('\n✅ ALL TESTS PASSED! Type guards are working correctly.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runGuardTests();
}