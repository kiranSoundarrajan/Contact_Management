import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ path: envFile });

console.log(`📁 Using environment: ${process.env.NODE_ENV}`);
console.log(`📊 Connecting to database: ${process.env.DB_NAME}`);
console.log(`🌐 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
console.log(`👤 User: ${process.env.DB_USER}`);
console.log(`🔑 Password: ${process.env.DB_PASSWORD ? "***SET***" : "***EMPTY***"}`);

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string, // Keep as string, empty string is fine
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    // IMPORTANT: Remove dialectOptions for empty password
    // MySQL usually handles empty password without special options
    
    // Add retry logic
    retry: {
      max: process.env.NODE_ENV === 'production' ? 3 : 1
    }
  }
);

// Test connection with better error handling
sequelize.authenticate()
  .then(() => {
    console.log(`✅ Connected to ${process.env.NODE_ENV} database: ${process.env.DB_NAME}`);
  })
  .catch((err) => {
    console.error(`❌ Database connection failed for ${process.env.NODE_ENV}:`, err.message);
    console.log(`🔍 Connection Details:`);
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    
    // Provide troubleshooting steps
    console.log(`\n🔧 Troubleshooting Steps for MySQL:`);
    console.log(`1. Check if MySQL is running: sudo systemctl status mysql`);
    console.log(`2. Login to MySQL: mysql -u root -p`);
    console.log(`3. Check existing databases: SHOW DATABASES;`);
    console.log(`4. Create database if needed: CREATE DATABASE ${process.env.DB_NAME};`);
    console.log(`5. Grant privileges: GRANT ALL ON ${process.env.DB_NAME}.* TO '${process.env.DB_USER}'@'localhost';`);
    console.log(`6. If using empty password, ensure it's allowed: ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';`);
  });

export default sequelize;