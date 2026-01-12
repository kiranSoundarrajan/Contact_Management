import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config(); // Load .env

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false // Turn off query logging
  }
);

export default sequelize;