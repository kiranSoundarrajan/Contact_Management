import bcrypt from "bcryptjs";
import User from "../models/User";

interface SafeUserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const registerService = async (data: any): Promise<SafeUserData> => {
  try {
    console.log("📝 REGISTER SERVICE START ================");
    console.log("Data received:", { 
      username: data.username, 
      email: data.email, 
      role: data.role 
    });

    const { username, email, password, role = "user" } = data;

    // Validate input
    if (!username || !email || !password) {
      throw new Error("All fields are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    if (username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });
    if (existingUser) {
      console.log(`❌ User already exists: ${email}`);
      throw new Error("User already exists with this email");
    }

    console.log(`✅ No duplicate found, creating user...`);

    // Create user - password will be hashed by model hook (10 rounds)
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: password, // ✅ Plain password - model hook will hash it
      role: role.toLowerCase()
    });

    console.log(`✅ User created in DB with ID: ${user.id}`);
    console.log(`User details:`, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      passwordHash: user.password.substring(0, 20) + "..."
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
  } catch (error: any) {
    console.error("❌ REGISTER SERVICE ERROR:", error.message);
    
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.errors[0].path === 'username') {
        throw new Error("Username already taken");
      }
      if (error.errors[0].path === 'email') {
        throw new Error("Email already registered");
      }
    }
    
    throw error;
  }
};

export const loginService = async (email: string, password: string): Promise<SafeUserData | null> => {
  try {
    console.log(`\n🔍 LOGIN SERVICE START ================`);
    console.log(`Email: ${email}`);
    console.log(`Password length: ${password.length}`);

    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase().trim() 
      } 
    });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return null;
    }
    
    console.log(`✅ User found in DB:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
    
    // Verify password - this is CORRECT
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`❌ Password mismatch for user: ${email}`);
      return null;
    }
    
    console.log(`✅ Password verified successfully`);
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
  } catch (error: any) {
    console.error(`❌ LOGIN SERVICE ERROR: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    return null;
  }
};

export const createAdminService = async () => {
  try {
    console.log("\n👑 CREATE ADMIN SERVICE START");
    
    const adminEmail = process.env.ADMIN_EMAIL || "kiransoundarrajan@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "1234567890";
    
    console.log(`Admin email: ${adminEmail}`);
    console.log(`Admin password length: ${adminPassword.length}`);
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { email: adminEmail.toLowerCase() } 
    });
    
    if (existingAdmin) {
      console.log("✅ Admin already exists, updating...");
      
      // Update admin password - model hook will hash it
      await existingAdmin.update({ 
        password: adminPassword, // ✅ Plain password - model hook will hash it
        role: "admin" 
      });
      
      console.log(`✅ Admin password updated for ID: ${existingAdmin.id}`);
      
      return { 
        message: "Admin credentials updated",
        admin: {
          id: existingAdmin.id,
          username: existingAdmin.username,
          email: existingAdmin.email,
          role: existingAdmin.role
        }
      };
    }
    
    // Create admin - password will be hashed by model hook
    const admin = await User.create({
      username: "Nakkeeran S",
      email: adminEmail,
      password: adminPassword, // ✅ Plain password - model hook will hash it
      role: "admin"
    });

    console.log(`✅ Admin created with ID: ${admin.id}`);
    console.log(`Admin password hash: ${admin.password.substring(0, 20)}...`);
    
    return { 
      message: "Admin created successfully",
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    };
  } catch (error: any) {
    console.error("❌ CREATE ADMIN SERVICE ERROR:", error.message);
    console.error("Stack:", error.stack);
    throw new Error(`Failed to create admin: ${error.message}`);
  }
};

// Debug function to check user
export const checkUserExistsService = async (email: string) => {
  try {
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    
    return {
      exists: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        passwordHash: user.password.substring(0, 20) + "..."
      } : null
    };
  } catch (error: any) {
    console.error("❌ CHECK USER SERVICE ERROR:", error.message);
    throw new Error(`Check user failed: ${error.message}`);
  }
};