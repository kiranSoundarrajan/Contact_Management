import sequelize from "./config/db";
import User from "./models/User";
import bcrypt from "bcryptjs";
import dotenv from "dotenv"; // ADD THIS
import path from "path"; // ADD THIS

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("🔍 Checking environment variables:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

const resetAdmin = async () => {
  try {
    console.log("🔄 Attempting to connect to database...");
    
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    const adminEmail = "kiransoundarrajan@gmail.com";
    const adminPassword = "1234567890";
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin exists
    let admin = await User.findOne({ where: { email: adminEmail } });
    
    if (admin) {
      // Update admin
      await admin.update({
        password: hashedPassword,
        role: "admin"
      });
      console.log("✅ Admin password updated");
    } else {
      // Create admin
      admin = await User.create({
        username: "Nakkeeran S",
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });
      console.log("✅ Admin created");
    }
    
    console.log("\n🔑 ADMIN CREDENTIALS:");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Role: admin");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    console.log("\n⚠️  Troubleshooting tips:");
    console.log("1. Check your .env file exists");
    console.log("2. Verify database credentials");
    console.log("3. Ensure database is running");
    process.exit(1);
  }
};

resetAdmin();