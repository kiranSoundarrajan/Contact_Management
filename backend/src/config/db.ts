// import { Sequelize } from "sequelize";
// import dotenv from "dotenv";

// dotenv.config(); // Load .env

// const sequelize = new Sequelize(
//   process.env.DB_NAME as string,
//   process.env.DB_USER as string,
//   process.env.DB_PASSWORD || "",
//   {
//     host: process.env.DB_HOST || "localhost",
//     dialect: "mysql",
//     logging: false // Turn off query logging
//   }
// );

// export default sequelize;

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

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
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

    dialectOptions: {
      connectTimeout: 60000,
      // Only add SSL for production (Railway)
      ...(process.env.NODE_ENV === 'production' && {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      })
    },

    // Add retry logic for production
    retry: {
      max: process.env.NODE_ENV === 'production' ? 3 : 1
    }
  }
);

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log(`✅ Connected to ${process.env.NODE_ENV} database: ${process.env.DB_NAME}`);
  })
  .catch((err) => {
    console.error(`❌ Database connection failed for ${process.env.NODE_ENV}:`, err.message);
    console.log(`🔍 Check if you're connected to the right database:`);
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
  });

export default sequelize;