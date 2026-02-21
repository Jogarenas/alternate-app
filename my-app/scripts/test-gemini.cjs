#!/usr/bin/env node
/**
 * Test Gemini API: call the proxy at localhost:5174 (proxy must be running).
 * Usage: from my-app folder, run: node scripts/test-gemini.cjs
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PROXY_URL = 'http://localhost:5174/api/gemini';

async function main() {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    console.error('Missing GEMINI_API_KEY in .env');
    process.exit(1);
  }
  console.log('Key loaded (length %d). Calling proxy at %s ...', key.length, PROXY_URL);

  const payload = {
    model: 'gemini-2.0-flash',
    system: 'You are a helpful assistant. Reply in one short sentence.',
    prompt: 'Say "Gemini is working" and nothing else.',
    maxTokens: 64,
  };

  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Proxy error:', res.status, data.error || data);
      process.exit(1);
    }
    console.log('OK. Response text:', (data.text || '').slice(0, 200));
    console.log('Gemini API is working.');
  } catch (e) {
    console.error('Request failed:', e.message);
    if (e.cause && e.cause.code === 'ECONNREFUSED') {
      console.error('Is the proxy running? Start it with: npm run start:proxy');
    }
    process.exit(1);
  }
}

main();
