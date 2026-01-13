// checkTables.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("🔍 Checking database structure...");
    
    // 1. Check Users table
    console.log("\n📊 USERS TABLE:");
    const [usersColumns] = await connection.execute("DESCRIBE Users");
    console.table(usersColumns);
    
    // 2. Check Contacts table
    console.log("\n📊 CONTACTS TABLE:");
    const [contactsColumns] = await connection.execute("DESCRIBE Contacts");
    console.table(contactsColumns);
    
    // 3. Check if AUTO_INCREMENT is set
    console.log("\n🔍 AUTO_INCREMENT STATUS:");
    
    const usersIdCol = usersColumns.find(col => col.Field === 'id');
    const contactsIdCol = contactsColumns.find(col => col.Field === 'id');
    
    console.log(`Users.id AUTO_INCREMENT: ${usersIdCol.Extra.includes('auto_increment') ? '✅ YES' : '❌ NO'}`);
    console.log(`Contacts.id AUTO_INCREMENT: ${contactsIdCol.Extra.includes('auto_increment') ? '✅ YES' : '❌ NO'}`);
    
    // 4. Show table creation SQL
    console.log("\n📋 TABLE CREATION SQL:");
    const [usersCreate] = await connection.execute("SHOW CREATE TABLE Users");
    console.log("USERS CREATE SQL:");
    console.log(usersCreate[0]['Create Table']);
    
    const [contactsCreate] = await connection.execute("SHOW CREATE TABLE Contacts");
    console.log("\nCONTACTS CREATE SQL:");
    console.log(contactsCreate[0]['Create Table']);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await connection.end();
  }
}

checkTables();