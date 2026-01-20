import bcrypt from "bcryptjs";
import User from "../models/User";

interface UserData {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
}

interface SafeUserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const registerService = async (data: any): Promise<SafeUserData> => {
  try {
    const { username, email, password, role = "user" } = data;

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Don't hash here - let the model hook handle it
    const user = await User.create({
      username,
      email,
      password: password, // Will be hashed by hook
      role: role.toLowerCase()
    });

    const userPlain = user.get({ plain: true }) as UserData;
    
    return {
      id: userPlain.id,
      username: userPlain.username,
      email: userPlain.email,
      role: userPlain.role
    };
  } catch (error: any) {
    console.error("REGISTER SERVICE ERROR:", error.message);
    throw error;
  }
};

export const createAdminService = async () => {
  try {
    const adminEmail = "kiransoundarrajan@gmail.com";
    
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      const adminPlain = existingAdmin.get({ plain: true }) as UserData;
      return { 
        message: "Admin already exists",
        admin: {
          id: adminPlain.id,
          username: adminPlain.username,
          email: adminPlain.email,
          role: adminPlain.role
        }
      };
    }
    
    // Password will be hashed by the hook
    const admin = await User.create({
      username: "Nakkeeran S",
      email: adminEmail,
      password: "1234567890", // Will be hashed by hook
      role: "admin"
    });

    const adminPlain = admin.get({ plain: true }) as UserData;
    
    return { 
      message: "Admin created successfully",
      admin: {
        id: adminPlain.id,
        username: adminPlain.username,
        email: adminPlain.email,
        role: adminPlain.role
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to create admin: ${error.message}`);
  }
};

export const loginService = async (email: string, password: string): Promise<SafeUserData | null> => {
  console.log(`\n🔍 LOGIN SERVICE START ================`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password ? "***" + password.substring(password.length - 2) : "undefined"}`);
  
  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    console.log(`❌ User not found: ${email}`);
    return null;
  }
  
  console.log(`✅ User found in DB:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Password hash: ${user.password.substring(0, 30)}...`);
  
  // Use the instance method
  const isMatch = await user.checkPassword(password);
  
  if (!isMatch) {
    console.log(`❌ Password mismatch`);
    
    // Extra debugging
    console.log(`🔍 Extra debug info:`);
    console.log(`   Hash type check:`);
    console.log(`     Starts with $2b$: ${user.password.startsWith('$2b$')}`);
    console.log(`     Starts with $2a$: ${user.password.startsWith('$2a$')}`);
    console.log(`     Starts with $2y$: ${user.password.startsWith('$2y$')}`);
    
    // Test hash creation
    try {
      const testHash = await bcrypt.hash(password, 10);
      console.log(`   Test hash (same password): ${testHash.substring(0, 30)}...`);
      console.log(`   Hashes equal: ${testHash === user.password}`);
    } catch (error) {
      console.log(`   Could not create test hash`);
    }
    
    return null;
  }
  
  console.log(`✅ Password verified successfully`);
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
};