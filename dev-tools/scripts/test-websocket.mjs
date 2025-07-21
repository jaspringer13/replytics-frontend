#!/usr/bin/env node

// Test WebSocket connection to backend
// Run with: node scripts/test-websocket.mjs

import WebSocket from 'ws';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
const businessId = 'test-business-id';
const token = 'test-token'; // Replace with actual token from authentication

const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + `/api/v2/config/businesses/${businessId}/ws?token=${token}`;

console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);

const ws = new WebSocket(wsUrl);

const timeout = setTimeout(() => {
  console.error('❌ Connection timed out');
  process.exit(1);
}, 5000);

ws.on('open', () => {
  console.log('✅ WebSocket connection established');
  clearTimeout(timeout);
  
  // Send a test message
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: new Date().toISOString()
  }));
});

ws.on('message', (data) => {
  console.log('📨 Received message:', data.toString());
  
  try {
    const message = JSON.parse(data.toString());
    console.log('Parsed message:', message);
  } catch (error) {
    console.log('Raw message (not JSON):', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔚 WebSocket closed. Code: ${code}, Reason: ${reason}`);
  process.exit(0);
});

// Keep the script running for 30 seconds to test the connection
setTimeout(() => {
  console.log('Test complete, closing connection...');
  ws.close();
}, 30000);

console.log('Press Ctrl+C to exit earlier');