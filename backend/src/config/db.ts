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

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT), // ⭐ IMPORTANT
    dialect: "mysql",
    logging: false,

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    dialectOptions: {
      // Railway MySQL PUBLIC URL compatible
      connectTimeout: 60000
      // ssl: { rejectUnauthorized: false } // enable only if needed
    }
  }
);

export default sequelize;

