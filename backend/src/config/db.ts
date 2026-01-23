import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3
    },
    dialectOptions: {
      connectTimeout: 60000
    }
  }
);

// Test connection
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connected successfully");
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`👤 User: ${process.env.DB_USER}`);
    console.log(`🌐 Host: ${process.env.DB_HOST}`);
  })
  .catch((err: any) => {
    console.error("❌ Database connection failed:");
    console.error(`Error: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
  });

export default sequelize;