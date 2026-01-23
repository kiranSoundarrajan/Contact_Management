// test-env.js
require('dotenv').config();

console.log("Testing dotenv...");
console.log("Current directory:", process.cwd());
console.log("DB_HOST:", process.env.DB_HOST || "NOT FOUND");
console.log("DB_USER:", process.env.DB_USER || "NOT FOUND");