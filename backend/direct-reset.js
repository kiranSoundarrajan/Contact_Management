const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

console.log('🔄 Direct Admin Reset - PowerShell Version');
console.log('==========================================');

async function resetAdmin() {
  // Your FreeSQLDatabase credentials
  const dbConfig = {
    host: 'sql12.freesqldatabase.com',
    user: 'sql12814932',
    password: 'xD2GRNR8Jp',
    database: 'sql12814932',
    port: 3306
  };
  
  const adminEmail = 'kiransoundarrajan@gmail.com';
  const adminPassword = '1234567890';
  
  try {
    console.log('\n1. Database-உட connect பண்ண attempt...');
    console.log('   Host:', dbConfig.host);
    console.log('   User:', dbConfig.user);
    console.log('   Database:', dbConfig.database);
    
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully!');
    
    console.log('\n2. Password hash பண்ணுது...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    console.log('\n3. Admin user check பண்ணுது...');
    const [rows] = await connection.execute(
      'SELECT * FROM Users WHERE email = ?',
      [adminEmail]
    );
    
    if (rows.length > 0) {
      console.log('✅ Admin found! Updating password...');
      await connection.execute(
        'UPDATE Users SET password = ?, role = ? WHERE email = ?',
        [hashedPassword, 'admin', adminEmail]
      );
      console.log('✅ Admin password updated!');
    } else {
      console.log('❌ Admin not found! Creating new admin...');
      await connection.execute(
        'INSERT INTO Users (username, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
        ['Nakkeeran S', adminEmail, hashedPassword, 'admin']
      );
      console.log('✅ New admin created!');
    }
    
    console.log('\n🔑 ADMIN LOGIN DETAILS:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Role: admin');
    
    await connection.end();
    console.log('\n🎉 Admin reset successfully completed!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️  Database access denied!');
      console.error('Possible reasons:');
      console.error('1. Wrong username/password');
      console.error('2. Database not accessible from your IP');
      console.error('3. Database service down');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  Cannot find database server!');
      console.error('Check your internet connection');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection refused!');
      console.error('Database might not be running on port 3306');
    }
    
    // Try to connect with different settings
    console.log('\n🔧 Trying alternative connection...');
    try {
      const testConn = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password
      });
      
      console.log('✅ Connected to MySQL server (without database)');
      
      // Check if database exists
      const [dbs] = await testConn.execute('SHOW DATABASES');
      console.log('📊 Available databases:', dbs.map(db => Object.values(db)[0]));
      
      await testConn.end();
    } catch (innerError) {
      console.error('❌ Even basic connection failed:', innerError.message);
    }
  }
}

resetAdmin();
