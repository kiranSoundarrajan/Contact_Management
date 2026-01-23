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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
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

export const loginService = async (email: string, password: string): Promise<SafeUserData | null> => {
  console.log(`\n🔍 LOGIN SERVICE START ================`);
  console.log(`Email: ${email}`);
  
  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    console.log(`❌ User not found: ${email}`);
    return null;
  }
  
  console.log(`✅ User found in DB:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Role: ${user.role}`);
  
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    console.log(`❌ Password mismatch`);
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

// Add missing createAdminService
export const createAdminService = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "kiransoundarrajan@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "1234567890";
    
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      // Update admin password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await existingAdmin.update({ password: hashedPassword });
      
      const adminPlain = existingAdmin.get({ plain: true }) as UserData;
      return { 
        message: "Admin password updated",
        admin: {
          id: adminPlain.id,
          username: adminPlain.username,
          email: adminPlain.email,
          role: adminPlain.role
        }
      };
    }
    
    // Create admin with hashed password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await User.create({
      username: "Nakkeeran S",
      email: adminEmail,
      password: hashedPassword,
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