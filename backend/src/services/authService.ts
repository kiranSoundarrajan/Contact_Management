import bcrypt from "bcryptjs";
import User from "../models/User";

interface SafeUserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

// In authService.ts - Updated registerService
export const registerService = async (data: any): Promise<SafeUserData> => {
  try {
    console.log("📝 REGISTER SERVICE START ================");
    console.log("Data received:", { 
      username: data.username, 
      email: data.email, 
      role: data.role,
      passwordLength: data.password.length
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

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });
    
    if (existingUser) {
      console.log(`❌ User already exists: ${email}`);
      throw new Error("User already exists with this email");
    }

    console.log(`✅ No duplicate found, creating user...`);
    console.log(`Original password: "${password}" (${password.length} chars)`);
    
    // 🔥 IMPORTANT: Send PLAIN password to model hook
    // The model hook will check and hash it if needed
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: password, // PLAIN PASSWORD - hook will hash it
      role: role.toLowerCase()
    });

    console.log(`✅ User created in DB with ID: ${user.id}`);
    console.log(`DB stored hash: ${user.password.substring(0, 30)}...`);
    console.log(`Hash starts with $2: ${user.password.startsWith('$2')}`);
    
    // Verify the stored hash works
    const dbMatch = await bcrypt.compare(password, user.password);
    console.log(`DB verification: ${dbMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!dbMatch) {
      console.log(`⚠️ WARNING: Password verification failed!`);
      console.log(`This means the model hook didn't hash properly`);
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
  } catch (error: any) {
    console.error("❌ REGISTER SERVICE ERROR:", error.message);
    console.error("Full error:", error);
    
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
// Update your loginService in authService.ts
export const loginService = async (email: string, password: string): Promise<SafeUserData | null> => {
  try {
    console.log(`\n🔍 LOGIN SERVICE START ================`);
    console.log(`Email received: "${email}"`);
    console.log(`Password received: "${password}"`);
    console.log(`Password length: ${password.length}`);

    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase().trim() 
      } 
    });
    
    if (!user) {
      console.log(`❌ User not found in DB: ${email}`);
      
      // Let's check what users actually exist
      const allUsers = await User.findAll({
        attributes: ['id', 'email', 'username']
      });
      console.log(`📊 All users in DB (${allUsers.length}):`);
      allUsers.forEach(u => console.log(`  - ${u.id}: ${u.email} (${u.username})`));
      
      return null;
    }
    
    console.log(`✅ User found in DB:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: "${user.username}"`);
    console.log(`   Email: "${user.email}"`);
    console.log(`   Role: "${user.role}"`);
    console.log(`   Password hash: ${user.password.substring(0, 60)}...`);
    console.log(`   Hash length: ${user.password.length}`);
    
    // Check if it looks like a bcrypt hash
    const hashPrefix = user.password.substring(0, 7);
    console.log(`   Hash prefix: "${hashPrefix}"`);
    
    // Bcrypt hashes should start with $2a$, $2b$, or $2y$
    if (!hashPrefix.startsWith('$2')) {
      console.log(`❌ WARNING: Password hash doesn't look like bcrypt!`);
      console.log(`   This might mean the model hook isn't hashing passwords`);
    }
    
    // Debug: Let's see what bcrypt.compare does
    console.log(`\n🔑 Attempting bcrypt.compare...`);
    console.log(`   Provided password: "${password}"`);
    console.log(`   Stored hash: ${user.password.substring(0, 30)}...`);
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log(`   bcrypt.compare result: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`❌ Password mismatch for user: ${email}`);
      
      // Try to debug by creating a test hash
      console.log(`\n🔧 Debug: Creating test hash of provided password...`);
      const testHash = await bcrypt.hash(password, 10);
      console.log(`   Test hash: ${testHash.substring(0, 30)}...`);
      console.log(`   Stored hash: ${user.password.substring(0, 30)}...`);
      
      // Check if they start the same
      console.log(`   Same prefix? ${testHash.substring(0, 7) === user.password.substring(0, 7)}`);
      
      // Try direct comparison (should fail if hashed differently)
      const directCompare = testHash === user.password;
      console.log(`   Direct string comparison: ${directCompare}`);
      
      return null;
    }
    
    console.log(`✅ Password verified successfully!`);
    
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
    
    // Manually hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log(`✅ Admin password hashed: ${hashedPassword.substring(0, 30)}...`);
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { email: adminEmail.toLowerCase() } 
    });
    
    if (existingAdmin) {
      console.log("✅ Admin already exists, updating...");
      
      // Update admin password with pre-hashed password
      await existingAdmin.update({ 
        password: hashedPassword,
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
    
    // Create admin with pre-hashed password
    const admin = await User.create({
      username: "Nakkeeran S",
      email: adminEmail,
      password: hashedPassword, // ✅ Use pre-hashed password
      role: "admin"
    });

    console.log(`✅ Admin created with ID: ${admin.id}`);
    console.log(`Admin password hash: ${admin.password.substring(0, 30)}...`);
    
    // Verify hash works
    const verifyHash = await bcrypt.compare(adminPassword, admin.password);
    console.log(`✅ Admin hash verification: ${verifyHash ? 'SUCCESS' : 'FAILED'}`);
    
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