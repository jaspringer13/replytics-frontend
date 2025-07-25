/**
 * Container Health Check Script
 * /Users/jakespringer/Desktop/Replytics Website/healthcheck.js
 */

const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  timeout: 5000,
  method: 'GET',
  headers: {
    'User-Agent': 'HealthCheck/1.0'
  }
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        if (response.status === 'healthy') {
          console.log('Health check passed:', response);
          process.exit(0);
        } else {
          console.log('Health check failed - unhealthy response:', response);
          process.exit(1);
        }
      } catch (e) {
        console.log('Health check failed - invalid JSON response:', data);
        process.exit(1);
      }
    } else {
      console.log('Health check failed - HTTP error:', res.statusCode);
      process.exit(1);
    }
  });
});

request.on('error', (err) => {
  console.log('Health check failed - request error:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('Health check failed - request timeout');
  request.destroy();
  process.exit(1);
});

request.setTimeout(options.timeout);
request.end();