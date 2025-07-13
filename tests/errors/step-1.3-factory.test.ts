/**
 * Verification tests for error factory (STEP 1.3)
 * Tests error conversion, context preservation, and cause chains
 */

import { ErrorFactory } from '@/lib/errors/factory';
import * as errors from '@/lib/errors/types';

// Mock axios error structure
function createAxiosError(config: {
  code?: string;
  message?: string;
  response?: {
    status: number;
    data: any;
    headers?: Record<string, string>;
  };
  config?: {
    url?: string;
    timeout?: number;
  };
}): any {
  return {
    isAxiosError: true,
    code: config.code,
    message: config.message || 'Request failed',
    response: config.response,
    config: config.config || {},
    request: config.response ? {} : undefined,
  };
}

// Mock Twilio error
function createTwilioError(code: number, message: string, extras?: any): any {
  return {
    code,
    message,
    status: code,
    ...extras,
  };
}

// Mock WebSocket close event
function createWebSocketCloseEvent(code: number): any {
  return {
    type: 'close',
    code,
  };
}

// Main test function
export function runFactoryTests(): void {
  console.log('=== STEP 1.3: Error Factory Verification ===\n');
  
  try {
    // Test 1: Axios error conversion - Network errors
    console.log('1. Testing Axios Network Error Conversion:');
    
    // Timeout error
    const timeoutAxios = createAxiosError({
      code: 'ECONNABORTED',
      message: 'timeout of 5000ms exceeded',
      config: { timeout: 5000 },
    });
    
    const timeoutError = ErrorFactory.fromAxiosError(timeoutAxios);
    if (!(timeoutError instanceof errors.TimeoutError)) {
      throw new Error('Should convert to TimeoutError');
    }
    if (timeoutError.timeoutMs !== 5000) {
      throw new Error('Should preserve timeout value');
    }
    console.log('✓ Timeout error conversion verified');
    
    // DNS error
    const dnsAxios = createAxiosError({
      code: 'ENOTFOUND',
      config: { url: 'https://invalid.domain.com' },
    });
    
    const dnsError = ErrorFactory.fromAxiosError(dnsAxios);
    if (!(dnsError instanceof errors.DNSError)) {
      throw new Error('Should convert to DNSError');
    }
    console.log('✓ DNS error conversion verified');
    
    // Offline error (simulate offline)
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    const offlineAxios = createAxiosError({
      message: 'Network Error',
    });
    
    const offlineError = ErrorFactory.fromAxiosError(offlineAxios);
    if (!(offlineError instanceof errors.OfflineError)) {
      throw new Error('Should convert to OfflineError when offline');
    }
    console.log('✓ Offline error conversion verified');
    
    // Reset online status
    Object.defineProperty(navigator, 'onLine', { value: true });
    
    // Test 2: Axios error conversion - HTTP status codes
    console.log('\n2. Testing Axios HTTP Status Code Conversion:');
    
    // 400 Validation error
    const validationAxios = createAxiosError({
      response: {
        status: 400,
        data: {
          message: 'Validation failed',
          errors: {
            email: ['Email is required'],
            phone: ['Invalid phone number'],
          },
        },
      },
      config: { url: '/api/users' },
    });
    
    const validationError = ErrorFactory.fromAxiosError(validationAxios, { userId: 'test123' });
    if (!(validationError instanceof errors.ValidationError)) {
      throw new Error('Should convert 400 to ValidationError');
    }
    if (!validationError.validationErrors?.email) {
      throw new Error('Should extract validation errors');
    }
    if (validationError.context?.userId !== 'test123') {
      throw new Error('Should preserve context');
    }
    console.log('✓ Validation error (400) conversion verified');
    
    // 401 Authentication error
    const authAxios = createAxiosError({
      response: {
        status: 401,
        data: { message: 'Token expired', reason: 'token_expired' },
      },
    });
    
    const authError = ErrorFactory.fromAxiosError(authAxios);
    if (!(authError instanceof errors.AuthenticationError)) {
      throw new Error('Should convert 401 to AuthenticationError');
    }
    if (authError.reason !== 'token_expired') {
      throw new Error('Should extract auth reason');
    }
    console.log('✓ Authentication error (401) conversion verified');
    
    // 429 Rate limit error
    const rateLimitAxios = createAxiosError({
      response: {
        status: 429,
        data: { message: 'Too many requests' },
        headers: {
          'retry-after': '60',
          'x-rate-limit-limit': '100',
        },
      },
    });
    
    const rateLimitError = ErrorFactory.fromAxiosError(rateLimitAxios);
    if (!(rateLimitError instanceof errors.RateLimitError)) {
      throw new Error('Should convert 429 to RateLimitError');
    }
    if (rateLimitError.retryAfter !== 60) {
      throw new Error('Should extract retry-after header');
    }
    if (rateLimitError.limit !== 100) {
      throw new Error('Should extract rate limit');
    }
    console.log('✓ Rate limit error (429) conversion verified');
    
    // 500 Server error
    const serverAxios = createAxiosError({
      response: {
        status: 500,
        data: { message: 'Internal server error' },
      },
    });
    
    const serverError = ErrorFactory.fromAxiosError(serverAxios);
    if (!(serverError instanceof errors.ServerError)) {
      throw new Error('Should convert 500 to ServerError');
    }
    console.log('✓ Server error (500) conversion verified');
    
    // Business logic error
    const businessAxios = createAxiosError({
      response: {
        status: 422,
        data: {
          message: 'Booking outside business hours',
          businessCode: 'INVALID_TIME',
        },
      },
    });
    
    const businessError = ErrorFactory.fromAxiosError(businessAxios);
    if (!(businessError instanceof errors.BusinessLogicError)) {
      throw new Error('Should convert 422 with businessCode to BusinessLogicError');
    }
    if (businessError.businessCode !== 'INVALID_TIME') {
      throw new Error('Should preserve business code');
    }
    console.log('✓ Business logic error (422) conversion verified');
    
    // Test 3: Twilio error conversion
    console.log('\n3. Testing Twilio Error Conversion:');
    
    const callState = {
      callId: 'call_123',
      phoneNumber: '+1234567890',
      duration: 120,
      isActive: true,
    };
    
    // Connection timeout
    const twilioTimeout = createTwilioError(31005, 'Connection timeout');
    const callDropped = ErrorFactory.fromTwilioError(twilioTimeout, callState);
    if (!(callDropped instanceof errors.CallDroppedError)) {
      throw new Error('Should convert Twilio 31005 to CallDroppedError');
    }
    if (callDropped.reason !== 'network') {
      throw new Error('Should identify as network issue');
    }
    if (callDropped.callState?.callId !== 'call_123') {
      throw new Error('Should preserve call state');
    }
    console.log('✓ Twilio connection error conversion verified');
    
    // Audio quality issue
    const twilioAudio = createTwilioError(31201, 'Poor audio quality', {
      jitter: 50,
      packetLoss: 5,
      latency: 200,
    });
    const audioError = ErrorFactory.fromTwilioError(twilioAudio, callState);
    if (!(audioError instanceof errors.AudioQualityError)) {
      throw new Error('Should convert Twilio 31201 to AudioQualityError');
    }
    if (audioError.metrics?.jitter !== 50) {
      throw new Error('Should preserve audio metrics');
    }
    console.log('✓ Twilio audio quality error conversion verified');
    
    // Webhook error
    const twilioWebhook = createTwilioError(11200, 'HTTP retrieval failure', {
      webhookType: 'status_callback',
    });
    const webhookError = ErrorFactory.fromTwilioError(twilioWebhook, callState);
    if (!(webhookError instanceof errors.TwilioWebhookError)) {
      throw new Error('Should convert webhook errors');
    }
    console.log('✓ Twilio webhook error conversion verified');
    
    // Test 4: WebSocket error conversion
    console.log('\n4. Testing WebSocket Error Conversion:');
    
    const wsCloseEvent = createWebSocketCloseEvent(1006);
    const wsError = ErrorFactory.fromWebSocketError(wsCloseEvent);
    if (!(wsError instanceof errors.WebSocketError)) {
      throw new Error('Should convert WebSocket close event');
    }
    if (wsError.closeCode !== 1006) {
      throw new Error('Should preserve close code');
    }
    console.log('✓ WebSocket close event conversion verified');
    
    // WebSocket with Error object
    const wsErrorObj = new Error('WebSocket connection failed');
    const wsErrorConverted = ErrorFactory.fromWebSocketError(wsErrorObj);
    if (!(wsErrorConverted instanceof errors.WebSocketError)) {
      throw new Error('Should convert WebSocket Error object');
    }
    if (wsErrorConverted.originalError !== wsErrorObj) {
      throw new Error('Should preserve original error');
    }
    console.log('✓ WebSocket Error object conversion verified');
    
    // Test 5: Transcription error conversion
    console.log('\n5. Testing Transcription Error Conversion:');
    
    const deepgramError = new Error('Deepgram API error');
    const transcriptionError = ErrorFactory.fromTranscriptionError(
      deepgramError,
      'deepgram',
      callState,
      { action: 'transcribe' }
    );
    
    if (!(transcriptionError instanceof errors.TranscriptionError)) {
      throw new Error('Should create TranscriptionError');
    }
    if (transcriptionError.provider !== 'deepgram') {
      throw new Error('Should preserve provider');
    }
    if (transcriptionError.callState?.callId !== 'call_123') {
      throw new Error('Should preserve call state');
    }
    console.log('✓ Transcription error conversion verified');
    
    // Test 6: Unknown error conversion
    console.log('\n6. Testing Unknown Error Conversion:');
    
    // Standard Error
    const standardError = new Error('Something went wrong');
    const convertedStandard = ErrorFactory.fromUnknown(standardError);
    if (!(convertedStandard instanceof errors.ThirdPartyError)) {
      throw new Error('Should convert standard Error to ThirdPartyError');
    }
    console.log('✓ Standard Error conversion verified');
    
    // String error
    const stringError = 'Error message';
    const convertedString = ErrorFactory.fromUnknown(stringError);
    if (!(convertedString instanceof errors.ThirdPartyError)) {
      throw new Error('Should convert string to ThirdPartyError');
    }
    console.log('✓ String error conversion verified');
    
    // Already AppError
    const appError = new errors.ValidationError('test');
    const convertedApp = ErrorFactory.fromUnknown(appError, 'default', { userId: '123' });
    if (!(convertedApp instanceof errors.ValidationError)) {
      throw new Error('Should preserve AppError type');
    }
    if (convertedApp.context?.userId !== '123') {
      throw new Error('Should add context to existing AppError');
    }
    console.log('✓ AppError preservation verified');
    
    // Test 7: Error cause chains
    console.log('\n7. Testing Error Cause Chains:');
    
    // Create error with cause chain
    const rootCause = new Error('Database connection failed');
    const axiosErrorWithCause = {
      ...createAxiosError({
        response: { status: 500, data: { message: 'Server error' } },
      }),
      cause: rootCause,
    };
    
    const chainedError = ErrorFactory.fromAxiosError(axiosErrorWithCause);
    if (!(chainedError.originalError)) {
      throw new Error('Should preserve original error');
    }
    
    // Test getRootCause
    const root = ErrorFactory.getRootCause(chainedError);
    if (root !== rootCause && root !== axiosErrorWithCause) {
      throw new Error('Should find root cause');
    }
    console.log('✓ Root cause extraction verified');
    
    // Test getErrorChain
    const chain = ErrorFactory.getErrorChain(chainedError);
    if (chain.length < 2) {
      throw new Error('Should return full error chain');
    }
    console.log('✓ Error chain extraction verified');
    
    // Test formatErrorChain
    const formatted = ErrorFactory.formatErrorChain(chainedError);
    if (!formatted.includes('ServerError') || !formatted.includes('↳')) {
      throw new Error('Should format error chain properly');
    }
    console.log('✓ Error chain formatting verified');
    console.log('Formatted chain:\n' + formatted);
    
    // Test 8: Composite errors
    console.log('\n8. Testing Composite Errors:');
    
    const error1 = new errors.NetworkError('Network failed', 'NET1');
    const error2 = new errors.TimeoutError(5000);
    const error3 = new errors.ServerError('Server down');
    
    const composite = ErrorFactory.createComposite(
      'Multiple failures',
      [error1, error2, error3],
      { operation: 'bulk_upload' }
    );
    
    if (!(composite instanceof errors.ThirdPartyError)) {
      throw new Error('Should create ThirdPartyError for composite');
    }
    console.log('Composite message:', composite.message);
    if (!composite.message.includes('Network failed') || 
        !composite.message.includes('Server down')) {
      throw new Error('Should include all error messages');
    }
    // Check for timeout message (which is "Request timed out after 5000ms")
    if (!composite.message.includes('timed out') && !composite.message.includes('timeout')) {
      throw new Error('Should include timeout error message');
    }
    if ((composite as any).allCauses?.length !== 3) {
      throw new Error('Should store all causes');
    }
    console.log('✓ Composite error creation verified');
    
    // Test 9: Context preservation
    console.log('\n9. Testing Context Preservation:');
    
    const contextError = new errors.ValidationError('Test error');
    const withCtx = ErrorFactory.withContext(contextError, {
      userId: 'user123',
      action: 'createBooking',
      metadata: { source: 'api' },
    });
    
    if (withCtx.context?.userId !== 'user123') {
      throw new Error('Should add context');
    }
    if (withCtx.context?.metadata?.source !== 'api') {
      throw new Error('Should preserve nested context');
    }
    console.log('✓ Context preservation verified');
    
    console.log('\n✅ ALL TESTS PASSED! Error factory is working correctly.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runFactoryTests();
}