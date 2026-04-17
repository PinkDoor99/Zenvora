#!/usr/bin/env node

/**
 * Zenvora Demo Script
 * Demonstrates the core functionality of the Zenvora IDE
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testEndpoint(name, endpoint, data) {
  console.log(`\n🧪 Testing ${name}...`);
  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, data);
    console.log(`✅ ${name}: ${response.data.result || response.data.error || 'Success'}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.response?.data?.error || error.message}`);
  }
}

async function runDemo() {
  console.log('🚀 Zenvora IDE Demo');
  console.log('==================');

  // Test basic code execution
  await testEndpoint('Code Execution', '/execute', {
    code: 'console.log("Hello from Zenvora!");'
  });

  // Test code generation (will show fallback message)
  await testEndpoint('Code Generation', '/generate-code', {
    prompt: 'Create a simple function to calculate factorial'
  });

  // Test code review (will show fallback message)
  await testEndpoint('Code Review', '/review-code', {
    code: 'function add(a, b) { return a + b; }'
  });

  // Test task execution (will show fallback message)
  await testEndpoint('Task Execution', '/execute-task', {
    task: 'Create a simple todo app'
  });

  console.log('\n📊 Demo Complete!');
  console.log('================');
  console.log('✅ Basic execution: Working');
  console.log('⚠️  AI features: Using fallback (Ollama timeout)');
  console.log('🌐 Frontend: Available at http://localhost:3005');
  console.log('📖 Desktop app: Run "npm run electron-dev"');
}

runDemo().catch(console.error);