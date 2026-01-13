// fixConstraint.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixConstraint() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("🔧 Fixing constraint issue...");
    
    // Check current constraints
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Contacts'
    `, [process.env.DB_NAME]);
    
    console.log("Current constraints on Contacts:", constraints.map(c => c.CONSTRAINT_NAME));
    
    // If Contacts_ibfk_1 exists, drop it
    const hasConstraint = constraints.some(c => c.CONSTRAINT_NAME === 'Contacts_ibfk_1');
    
    if (hasConstraint) {
      console.log("🔄 Dropping Contacts_ibfk_1 constraint...");
      await connection.execute("ALTER TABLE Contacts DROP FOREIGN KEY Contacts_ibfk_1");
      console.log("✅ Constraint dropped");
    } else {
      console.log("✅ Contacts_ibfk_1 constraint doesn't exist (already fixed)");
    }
    
    // Add proper constraint if needed
    console.log("\n🔄 Adding proper foreign key constraint...");
    
    // First check if the constraint already exists with a different name
    const [newConstraints] = await connection.execute(`
      SELECT * 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'Contacts' 
        AND COLUMN_NAME = 'userId'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);
    
    if (newConstraints.length === 0) {
      await connection.execute(`
        ALTER TABLE Contacts 
        ADD CONSTRAINT FK_Contacts_Users 
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      `);
      console.log("✅ New foreign key constraint added");
    } else {
      console.log("✅ Foreign key constraint already exists");
    }
    
    console.log("\n🎉 Constraint issue fixed!");
    console.log("🚀 Now restart your server");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await connection.end();
  }
}

fixConstraint();