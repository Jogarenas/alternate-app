#!/usr/bin/env node
/**
 * Verify GEMINI_API_KEY is loaded from .env or .env.local (same logic as proxy).
 * Run from my-app: node scripts/check-env.cjs
 */
const path = require('path');
const fs = require('fs');
const appRoot = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(appRoot, '.env') });
require('dotenv').config({ path: path.join(appRoot, '.env.local'), override: true });

const key = (process.env.GEMINI_API_KEY || '').replace(/^\uFEFF/, '').trim();

console.log('App root:', appRoot);
console.log('.env exists:', fs.existsSync(path.join(appRoot, '.env')));
console.log('.env.local exists:', fs.existsSync(path.join(appRoot, '.env.local')));
console.log('GEMINI_API_KEY length:', key.length);
console.log('GEMINI_API_KEY starts with AIza:', key.startsWith('AIza'));
if (key.length > 0 && key.length < 50) {
  console.log('First 8 chars:', key.slice(0, 8) + '...');
}

if (!key) {
  console.error('\nNo key found. In my-app/.env.local put exactly one line:');
  console.error('  GEMINI_API_KEY=AIzaSy...your_key');
  console.error('(no quotes, no spaces around =)');
  process.exit(1);
}

console.log('\nKey is loaded. Restart the proxy (npm run start:proxy) if it was already running.');
process.exit(0);
