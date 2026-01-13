import sequelize from "./config/db";
import User from "./models/User";
import Contact from "./models/Contact";

const resetDatabase = async () => {
  try {
    console.log("🔧 Resetting database...");
    
    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    // Show what tables exist
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME}'
    `);
    console.log("📋 Existing tables:", tables);
    
    // Drop all tables
    console.log("🗑️ Dropping all tables...");
    await sequelize.drop();
    console.log("✅ Tables dropped");
    
    // Sync to create fresh tables
    console.log("🔄 Creating fresh tables...");
    await sequelize.sync({ force: true });
    console.log("✅ Tables created");
    
    // Verify tables were created
    const [newTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME}'
    `);
    console.log("📋 New tables created:", newTables);
    
    console.log("🎉 Database reset complete!");
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error during database reset:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    if (error.original) {
      console.error("Original error:", error.original.message);
    }
    
    process.exit(1);
  }
};

// Run the reset
resetDatabase();