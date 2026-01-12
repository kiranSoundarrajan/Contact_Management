const mysql = require("mysql2");
require("dotenv").config();

console.log("🔍 Testing Railway MySQL Connection...");
console.log("Host:", process.env.DB_HOST);
console.log("User:", process.env.DB_USER);
console.log("Database:", process.env.DB_NAME);

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Connection failed:", err.message);
  } else {
    console.log("✅ Connected to Railway MySQL!");
    
    // Create tables
    const createTables = `
      CREATE TABLE IF NOT EXISTS Users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS Contacts (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        place VARCHAR(255) NOT NULL,
        dob VARCHAR(255) NOT NULL,
        userId INT UNSIGNED NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id)
      );
    `;
    
    connection.query(createTables, (err) => {
      if (err) {
        console.error("❌ Table creation failed:", err.message);
      } else {
        console.log("✅ Tables created/verified!");
      }
      connection.end();
    });
  }
});