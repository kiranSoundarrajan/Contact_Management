console.log('📁 Current working directory:', process.cwd());
console.log('');

const fs = require('fs');
const path = require('path');

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
console.log('🔍 Looking for .env at:', envPath);
console.log('.env exists?', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('\n📝 .env content:');
  console.log('----------------');
  console.log(fs.readFileSync(envPath, 'utf8'));
  console.log('----------------');
}

// Load environment variables
require('dotenv').config();
console.log('\n✅ Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT FOUND');
console.log('DB_USER:', process.env.DB_USER || 'NOT FOUND');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT FOUND');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'NOT FOUND');
