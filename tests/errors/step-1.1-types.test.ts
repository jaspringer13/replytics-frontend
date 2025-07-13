/**
 * Verification tests for error type system (STEP 1.1)
 * Tests inheritance, serialization, and all error types
 */

import {
  AppError,
  NetworkError,
  TimeoutError,
  OfflineError,
  DNSError,
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  BusinessLogicError,
  VoiceCallError,
  CallDroppedError,
  AudioQualityError,
  TranscriptionError,
  TwilioWebhookError,
  CalendarError,
  GoogleAuthError,
  BookingConflictError,
  CalendarSyncError,
  MessagingError,
  SMSDeliveryError,
  NotificationError,
  UIError,
  RenderError,
  HydrationError,
  AssetLoadError,
  IntegrationError,
  WebSocketError,
  ThirdPartyError,
  PaymentError,
} from '@/lib/errors/types';

// Test helper to verify error properties
function verifyError(
  error: AppError,
  expectedName: string,
  expectedCode: string,
  expectedMessage?: string
): void {
  console.log(`Testing ${expectedName}...`);
  
  // Verify basic properties
  if (error.name !== expectedName) {
    throw new Error(`Expected name '${expectedName}', got '${error.name}'`);
  }
  
  if (error.code !== expectedCode) {
    throw new Error(`Expected code '${expectedCode}', got '${error.code}'`);
  }
  
  if (expectedMessage && error.message !== expectedMessage) {
    throw new Error(`Expected message '${expectedMessage}', got '${error.message}'`);
  }
  
  // Verify timestamp
  if (!(error.timestamp instanceof Date)) {
    throw new Error('Timestamp should be a Date instance');
  }
  
  // Verify it's operational by default
  if (error.isOperational !== true) {
    throw new Error('isOperational should be true by default');
  }
  
  console.log(`✓ ${expectedName} verified`);
}

// Test helper to verify inheritance chain
function verifyInheritance(error: any, ...expectedClasses: Function[]): void {
  for (const expectedClass of expectedClasses) {
    if (!(error instanceof expectedClass)) {
      throw new Error(`${error.constructor.name} should be instanceof ${expectedClass.name}`);
    }
  }
  console.log(`✓ Inheritance chain verified for ${error.constructor.name}`);
}

// Main test function
export function runErrorTypeTests(): void {
  console.log('=== STEP 1.1: Error Type System Verification ===\n');
  
  try {
    // Test 1: Network Errors
    console.log('1. Testing Network Errors:');
    
    const timeoutError = new TimeoutError(5000, { userId: 'test123' });
    verifyError(timeoutError, 'TimeoutError', 'NETWORK_TIMEOUT', 'Request timed out after 5000ms');
    verifyInheritance(timeoutError, Error, AppError, NetworkError);
    if (timeoutError.timeoutMs !== 5000) {
      throw new Error('timeoutMs should be 5000');
    }
    
    const offlineError = new OfflineError();
    verifyError(offlineError, 'OfflineError', 'NETWORK_OFFLINE', 'No internet connection');
    verifyInheritance(offlineError, Error, AppError, NetworkError);
    
    const dnsError = new DNSError('api.replytics.com');
    verifyError(dnsError, 'DNSError', 'NETWORK_DNS', 'DNS resolution failed for api.replytics.com');
    verifyInheritance(dnsError, Error, AppError, NetworkError);
    
    // Test 2: API Errors
    console.log('\n2. Testing API Errors:');
    
    const validationError = new ValidationError(
      'Invalid input',
      { email: ['Email is required'], phone: ['Invalid format'] },
      '/api/bookings'
    );
    verifyError(validationError, 'ValidationError', 'API_VALIDATION_ERROR', 'Invalid input');
    verifyInheritance(validationError, Error, AppError, APIError);
    if (validationError.statusCode !== 400) {
      throw new Error('ValidationError should have statusCode 400');
    }
    
    const authError = new AuthenticationError('token_expired', '/api/calls');
    verifyError(authError, 'AuthenticationError', 'API_AUTHENTICATION_ERROR', 'Authentication token expired');
    if (authError.reason !== 'token_expired') {
      throw new Error('reason should be token_expired');
    }
    
    const authzError = new AuthorizationError('admin', '/api/settings');
    verifyError(authzError, 'AuthorizationError', 'API_AUTHORIZATION_ERROR');
    
    const notFoundError = new NotFoundError('Booking', '123', '/api/bookings/123');
    verifyError(notFoundError, 'NotFoundError', 'API_NOT_FOUND', 'Booking with id 123 not found');
    
    const rateLimitError = new RateLimitError(60, 100, '/api/calls');
    verifyError(rateLimitError, 'RateLimitError', 'API_RATE_LIMIT');
    
    const serverError = new ServerError();
    verifyError(serverError, 'ServerError', 'API_SERVER_ERROR', 'Internal server error');
    
    const businessError = new BusinessLogicError('Booking outside business hours', 'INVALID_TIME');
    verifyError(businessError, 'BusinessLogicError', 'BUSINESS_INVALID_TIME');
    
    // Test 3: Voice Call Errors (CRITICAL)
    console.log('\n3. Testing Voice Call Errors (CRITICAL):');
    
    const callState = {
      callId: 'call_123',
      phoneNumber: '+1234567890',
      duration: 120,
      isActive: true,
      transcriptSoFar: 'Hello, I would like to book an appointment...'
    };
    
    const callDropped = new CallDroppedError('network', callState);
    verifyError(callDropped, 'CallDroppedError', 'VOICE_CALL_DROPPED', 'Call dropped: network');
    verifyInheritance(callDropped, Error, AppError, VoiceCallError);
    
    // Verify call state is preserved
    if (!callDropped.callState || callDropped.callState.callId !== 'call_123') {
      throw new Error('Call state must be preserved in VoiceCallError');
    }
    console.log('✓ Call state preserved correctly');
    
    const audioError = new AudioQualityError(
      { jitter: 50, packetLoss: 5, latency: 200 },
      callState
    );
    verifyError(audioError, 'AudioQualityError', 'VOICE_AUDIO_QUALITY');
    
    const transcriptionError = new TranscriptionError('deepgram', callState);
    verifyError(transcriptionError, 'TranscriptionError', 'VOICE_TRANSCRIPTION');
    
    const webhookError = new TwilioWebhookError('status_callback', callState);
    verifyError(webhookError, 'TwilioWebhookError', 'VOICE_TWILIO_WEBHOOK');
    
    // Test 4: Calendar Errors
    console.log('\n4. Testing Calendar Errors:');
    
    const googleAuthError = new GoogleAuthError('refresh');
    verifyError(googleAuthError, 'GoogleAuthError', 'CALENDAR_GOOGLE_AUTH');
    verifyInheritance(googleAuthError, Error, AppError, CalendarError);
    
    const bookingConflict = new BookingConflictError([
      { start: new Date('2024-01-15T10:00:00'), end: new Date('2024-01-15T11:00:00') }
    ]);
    verifyError(bookingConflict, 'BookingConflictError', 'CALENDAR_BOOKING_CONFLICT');
    
    const syncError = new CalendarSyncError('google');
    verifyError(syncError, 'CalendarSyncError', 'CALENDAR_SYNC');
    
    // Test 5: Messaging Errors
    console.log('\n5. Testing Messaging Errors:');
    
    const smsError = new SMSDeliveryError('+1234567890', 'verizon');
    verifyError(smsError, 'SMSDeliveryError', 'MESSAGING_SMS_DELIVERY');
    verifyInheritance(smsError, Error, AppError, MessagingError);
    
    const notificationError = new NotificationError('push');
    verifyError(notificationError, 'NotificationError', 'MESSAGING_NOTIFICATION');
    
    // Test 6: UI Errors
    console.log('\n6. Testing UI Errors:');
    
    const renderError = new RenderError('DashboardStats');
    verifyError(renderError, 'RenderError', 'UI_RENDER');
    verifyInheritance(renderError, Error, AppError, UIError);
    
    const hydrationError = new HydrationError('Text content mismatch');
    verifyError(hydrationError, 'HydrationError', 'UI_HYDRATION');
    
    const assetError = new AssetLoadError('/scripts/analytics.js', 'script');
    verifyError(assetError, 'AssetLoadError', 'UI_ASSET_LOAD');
    
    // Test 7: Integration Errors
    console.log('\n7. Testing Integration Errors:');
    
    const wsError = new WebSocketError('connection', 1006);
    verifyError(wsError, 'WebSocketError', 'INTEGRATION_WEBSOCKET');
    verifyInheritance(wsError, Error, AppError, IntegrationError);
    
    const thirdPartyError = new ThirdPartyError('sendgrid', 'Email service unavailable');
    verifyError(thirdPartyError, 'ThirdPartyError', 'INTEGRATION_THIRD_PARTY');
    
    const paymentError = new PaymentError('stripe', 'Card declined', 'visa');
    verifyError(paymentError, 'PaymentError', 'INTEGRATION_PAYMENT');
    
    // Test 8: Error Serialization
    console.log('\n8. Testing Error Serialization:');
    
    const errorToSerialize = new ValidationError(
      'Test error',
      { field: ['error'] },
      '/api/test',
      { userId: 'user123', action: 'createBooking' }
    );
    
    const serialized = errorToSerialize.toJSON();
    
    if (!serialized.name || !serialized.message || !serialized.code) {
      throw new Error('Serialized error missing required fields');
    }
    
    if (!serialized.context || serialized.context.userId !== 'user123') {
      throw new Error('Context not properly serialized');
    }
    
    console.log('✓ Error serialization working correctly');
    console.log('Serialized output:', JSON.stringify(serialized, null, 2));
    
    // Test 9: Edge Cases
    console.log('\n9. Testing Edge Cases:');
    
    // Test with original error
    const originalError = new Error('Original error');
    const wrappedError = new ServerError('Wrapped error', 500, '/api/test', undefined, originalError);
    
    if (wrappedError.originalError !== originalError) {
      throw new Error('Original error not preserved');
    }
    console.log('✓ Original error preservation working');
    
    // Test instanceof with all levels
    const deepError = new CallDroppedError('network');
    if (!(deepError instanceof Error)) {
      throw new Error('Should be instanceof Error');
    }
    if (!(deepError instanceof AppError)) {
      throw new Error('Should be instanceof AppError');
    }
    if (!(deepError instanceof VoiceCallError)) {
      throw new Error('Should be instanceof VoiceCallError');
    }
    if (!(deepError instanceof CallDroppedError)) {
      throw new Error('Should be instanceof CallDroppedError');
    }
    console.log('✓ instanceof checks working at all inheritance levels');
    
    console.log('\n✅ ALL TESTS PASSED! Error type system is working correctly.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runErrorTypeTests();
}