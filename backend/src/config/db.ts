import { Sequelize } from "sequelize";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    retry: { max: process.env.NODE_ENV === "production" ? 3 : 1 },
  }
);

// Test connection
sequelize
  .authenticate()
  .then(() => console.log(`✅ Connected to DB: ${process.env.DB_NAME}`))
  .catch((err) => {
    console.error(`❌ DB connection failed: ${err.message}`);
    console.log("Check MySQL status, credentials, database existence, or empty password configuration.");
  });

export default sequelize;
