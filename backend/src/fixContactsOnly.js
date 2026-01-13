// fixContactsComplete.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixContactsComplete() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("🔧 Complete fix for Contacts table...");
    
    // First, backup existing contacts data
    console.log("\n📊 Backing up existing contacts...");
    const [contacts] = await connection.execute("SELECT * FROM Contacts");
    console.log(`Found ${contacts.length} contacts to backup`);
    
    // Drop and recreate the table with proper defaults
    console.log("\n🗑️ Dropping Contacts table...");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
    await connection.execute("DROP TABLE Contacts");
    
    console.log("\n🔄 Creating new Contacts table with proper defaults...");
    await connection.execute(`
      CREATE TABLE Contacts (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        place VARCHAR(255) NOT NULL,
        dob VARCHAR(255) NOT NULL,
        userId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ Contacts table recreated with proper defaults");
    
    // Restore data if any existed
    if (contacts.length > 0) {
      console.log("\n🔄 Restoring contacts data...");
      for (const contact of contacts) {
        await connection.execute(
          `INSERT INTO Contacts (id, name, email, place, dob, userId, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            contact.id, 
            contact.name, 
            contact.email, 
            contact.place, 
            contact.dob, 
            contact.userId,
            contact.createdAt || new Date(),
            contact.updatedAt || new Date()
          ]
        );
      }
      console.log(`✅ Restored ${contacts.length} contacts`);
    }
    
    // Test insertion
    console.log("\n🧪 Testing new insertion...");
    
    // Get a user ID
    const [users] = await connection.execute("SELECT id FROM Users LIMIT 1");
    
    if (users.length > 0) {
      const userId = users[0].id;
      
      // Test 1: Insert without timestamps (should use defaults)
      console.log("\nTest 1: Insert without timestamps...");
      const [result1] = await connection.execute(
        "INSERT INTO Contacts (name, email, place, dob, userId) VALUES (?, ?, ?, ?, ?)",
        ['Auto Timestamp Test', 'auto@test.com', 'Auto City', '2000-01-01', userId]
      );
      console.log(`✅ Inserted with ID: ${result1.insertId}`);
      
      // Check what was inserted
      const [inserted1] = await connection.execute(
        "SELECT id, name, createdAt, updatedAt FROM Contacts WHERE id = ?",
        [result1.insertId]
      );
      console.log("Inserted record:", inserted1[0]);
      
      // Test 2: Insert with explicit timestamps
      console.log("\nTest 2: Insert with explicit timestamps...");
      const now = new Date();
      const [result2] = await connection.execute(
        "INSERT INTO Contacts (name, email, place, dob, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['Manual Timestamp Test', 'manual@test.com', 'Manual City', '2001-02-02', userId, now, now]
      );
      console.log(`✅ Inserted with ID: ${result2.insertId}`);
      
      // Clean up test data
      console.log("\n🧹 Cleaning up test data...");
      await connection.execute("DELETE FROM Contacts WHERE id IN (?, ?)", [result1.insertId, result2.insertId]);
      console.log("✅ Test data cleaned up");
    } else {
      console.log("⚠️ No users found. Creating test user...");
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      const [userResult] = await connection.execute(
        "INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)",
        ['TestUser', 'testuser@example.com', hashedPassword, 'user']
      );
      
      const [contactResult] = await connection.execute(
        "INSERT INTO Contacts (name, email, place, dob, userId) VALUES (?, ?, ?, ?, ?)",
        ['Test Contact', 'test@example.com', 'Test City', '2000-01-01', userResult.insertId]
      );
      
      console.log(`✅ Test contact inserted with ID: ${contactResult.insertId}`);
      
      // Check timestamps
      const [check] = await connection.execute(
        "SELECT createdAt, updatedAt FROM Contacts WHERE id = ?",
        [contactResult.insertId]
      );
      console.log("Auto-generated timestamps:", check[0]);
      
      // Clean up
      await connection.execute("DELETE FROM Contacts WHERE id = ?", [contactResult.insertId]);
      await connection.execute("DELETE FROM Users WHERE id = ?", [userResult.insertId]);
    }
    
    console.log("\n🎉 CONTACTS TABLE COMPLETELY FIXED!");
    console.log("✅ AUTO_INCREMENT enabled");
    console.log("✅ Timestamp defaults set");
    console.log("✅ Foreign key constraints intact");
    console.log("✅ All existing data restored");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.sql) {
      console.error("SQL error:", error.sqlMessage);
      console.error("SQL:", error.sql);
    }
  } finally {
    await connection.end();
  }
}

fixContactsComplete();