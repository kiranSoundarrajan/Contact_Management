// directFix.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function directFix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("🚨 DIRECT FIX FOR AUTO_INCREMENT ISSUE 🚨");
    
    // 1. Check if Users table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'Users'"
    );
    
    if (tables.length === 0) {
      console.log("📋 Users table doesn't exist. Creating it...");
      await createUsersTable(connection);
    } else {
      console.log("📋 Users table exists. Checking structure...");
      
      // 2. Describe the table
      const [columns] = await connection.execute("DESCRIBE Users");
      console.log("\n📊 Current Users table structure:");
      columns.forEach(col => {
        console.log(`${col.Field}: ${col.Type} | Null: ${col.Null} | Key: ${col.Key} | Default: ${col.Default} | Extra: ${col.Extra}`);
      });
      
      // 3. Check if id has AUTO_INCREMENT
      const idColumn = columns.find(col => col.Field === 'id');
      if (idColumn && !idColumn.Extra.includes('auto_increment')) {
        console.log("\n⚠️ AUTO_INCREMENT missing! Fixing...");
        
        // 4. Get all data first (if any)
        const [users] = await connection.execute("SELECT * FROM Users");
        console.log(`Found ${users.length} existing users`);
        
        // 5. Drop and recreate table with AUTO_INCREMENT
        console.log("\n🔄 Recreating Users table with AUTO_INCREMENT...");
        
        // Disable foreign key checks temporarily
        await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
        
        // Drop table
        await connection.execute("DROP TABLE Users");
        console.log("✅ Old Users table dropped");
        
        // Create new table with proper AUTO_INCREMENT
        await createUsersTable(connection);
        
        // Re-enable foreign key checks
        await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
        
        console.log("✅ Users table recreated with AUTO_INCREMENT");
      } else {
        console.log("\n✅ id column already has AUTO_INCREMENT");
      }
    }
    
    // 6. Test inserting a user
    console.log("\n🧪 Testing insertion...");
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const [result] = await connection.execute(
      "INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)",
      ['TestUser', 'test@example.com', hashedPassword, 'user']
    );
    
    console.log(`✅ Test insertion successful! Insert ID: ${result.insertId}`);
    
    // Clean up test user
    await connection.execute("DELETE FROM Users WHERE email = 'test@example.com'");
    console.log("✅ Test user cleaned up");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("Error code:", error.code);
    
    if (error.sql) {
      console.error("SQL:", error.sql);
    }
  } finally {
    await connection.end();
    console.log("\n🎉 Direct fix completed!");
  }
}

async function createUsersTable(connection) {
  await connection.execute(`
    CREATE TABLE Users (
      id INT NOT NULL AUTO_INCREMENT,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Users table created with AUTO_INCREMENT");
}

directFix();