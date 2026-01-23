import { Request, Response } from "express";
import { createAdminService, loginService, registerService, checkUserExistsService } from "../services/authService";
import jwt from "jsonwebtoken";
import { blacklistToken } from "../middlewares/authMiddlewares";
import User from "../models/User";
import bcrypt from "bcryptjs";

export const login = async (req: Request, res: Response) => {
  try {
    console.log("\n🔍 LOGIN ENDPOINT HIT ================");
    console.log("Request body:", req.body);
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }
    
    if (typeof email !== 'string' || typeof password !== 'string') {
      console.log("❌ Invalid input types");
      return res.status(400).json({
        success: false,
        message: "Email and password must be strings"
      });
    }
    
    console.log("✅ Valid input received");
    console.log(`Email: ${email}, Password length: ${password.length}`);
    
    // Call login service
    const user = await loginService(email, password);
    
    if (!user) {
      console.log("❌ Invalid credentials");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log("✅ Login service successful");
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    console.log("✅ LOGIN SUCCESSFUL ================");
    console.log("User ID:", user.id);
    console.log("User Email:", user.email);
    console.log("User Role:", user.role);
    console.log("Token generated (length):", token.length);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
    
  } catch (error: any) {
    console.error("❌ LOGIN ERROR:", error.message);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      error: error.message
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    console.log("\n📝 REGISTER ATTEMPT ================");
    console.log("Request body:", req.body);
    
    const { username, email, password, role = "user" } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      console.log("❌ Missing fields");
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required"
      });
    }

    // Validate types
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: "All fields must be strings"
      });
    }

    console.log("👤 Username:", username);
    console.log("📧 Email:", email);
    console.log("🔑 Password length:", password.length);
    console.log("🎭 Role:", role);

    // Call register service
    const user = await registerService({ username, email, password, role });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    console.log("✅ REGISTRATION SUCCESSFUL");
    console.log("User created with ID:", user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error("❌ REGISTER ERROR:", error.message);
    
    // Handle specific errors
    if (error.message.includes("already exists")) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }
    
    if (error.message.includes("Password must be")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    console.log("\n👑 CREATE ADMIN ATTEMPT");
    
    const { secretKey } = req.body;
    
    if (!secretKey || secretKey !== process.env.ADMIN_SECRET_KEY) {
      console.log("❌ Invalid secret key");
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: Invalid secret key" 
      });
    }
    
    const result = await createAdminService();
    
    console.log("✅ Admin creation:", result.message);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error("❌ CREATE ADMIN ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (token) {
      blacklistToken(token);
      console.log("🚪 Token blacklisted");
    }
    
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("❌ LOGOUT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
};

// For debugging - check if user exists
export const checkUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    console.log("\n🔍 CHECK USER REQUEST");
    console.log("Email:", email);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    
    const result = await checkUserExistsService(email);
    
    console.log("✅ Check user result:", result);
    
    if (!result.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      user: result.user
    });
    
  } catch (error: any) {
    console.error("❌ CHECK USER ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify user credentials
export const verifyUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log("\n🔍 VERIFY USER REQUEST");
    console.log("Email:", email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    console.log("✅ User found:", user.email);
    console.log("Username:", user.username);
    console.log("Role:", user.role);
    console.log("Password hash:", user.password.substring(0, 20) + "...");
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);
    
    res.json({
      success: true,
      userExists: true,
      passwordMatch: isMatch,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error: any) {
    console.error("❌ VERIFY USER ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Test endpoint
export const testEndpoint = async (req: Request, res: Response) => {
  console.log("✅ Test endpoint called");
  res.json({
    success: true,
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
    userCount: await User.count()
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    
    console.log("\n🔄 RESET PASSWORD REQUEST");
    console.log("Email:", email);
    console.log("New password:", newPassword);
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required"
      });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    console.log("✅ User found:", user.email);
    console.log("Old hash:", user.password.substring(0, 30) + "...");
    
    // Update password - model hook will hash it
    await user.update({ password: newPassword });
    
    console.log("✅ Password updated");
    console.log("New hash:", user.password.substring(0, 30) + "...");
    
    res.json({
      success: true,
      message: "Password reset successfully",
      user: {
        id: user.id,
        email: user.email
      }
    });
    
  } catch (error: any) {
    console.error("❌ RESET PASSWORD ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Test JSON parse function
export const testJsonParse = async (req: Request, res: Response) => {
  try {
    console.log("\n✅ TEST JSON PARSE ENDPOINT CALLED");
    console.log("Request body:", req.body);
    console.log("Body type:", typeof req.body);
    
    res.json({
      success: true,
      message: "JSON parse test successful",
      body: req.body,
      bodyType: typeof req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("❌ Test JSON parse error:", error.message);
    res.status(400).json({
      success: false,
      message: "JSON parse test failed",
      error: error.message
    });
  }
};


export const debugAuthFlow = async (req: Request, res: Response) => {
  try {
    console.log("\n🔧 DEBUG AUTH FLOW ================");
    
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password required"
      });
    }
    
    console.log(`Test data:`);
    console.log(`  Username: "${username}"`);
    console.log(`  Email: "${email}"`);
    console.log(`  Password: "${password}"`);
    
    // Step 1: Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    console.log(`\n1. Check existing user:`);
    console.log(`   Exists: ${!!existingUser}`);
    if (existingUser) {
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Password hash: ${existingUser.password.substring(0, 30)}...`);
    }
    
    // Step 2: Create user if doesn't exist
    let user;
    if (!existingUser) {
      console.log(`\n2. Creating new user...`);
      user = await User.create({
        username,
        email,
        password,
        role: "user"
      });
      console.log(`   User created with ID: ${user.id}`);
      console.log(`   Generated hash: ${user.password.substring(0, 30)}...`);
    } else {
      user = existingUser;
    }
    
    // Step 3: Try to login
    console.log(`\n3. Testing login...`);
    const loginResult = await loginService(email, password);
    console.log(`   Login successful: ${!!loginResult}`);
    
    // Step 4: Manual password check
    console.log(`\n4. Manual password verification:`);
    const manualCheck = await bcrypt.compare(password, user.password);
    console.log(`   bcrypt.compare result: ${manualCheck}`);
    
    res.json({
      success: true,
      userExists: !!existingUser,
      userCreated: !existingUser,
      loginSuccessful: !!loginResult,
      manualCheck: manualCheck,
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHashPrefix: user.password.substring(0, 30) + "...",
        hashLength: user.password.length
      } : null
    });
    
  } catch (error: any) {
    console.error("❌ DEBUG AUTH FLOW ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const checkPasswordHash = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({
      success: true,
      user: {
        email: user.email,
        username: user.username,
        passwordHash: user.password,
        hashStartsWith: user.password.substring(0, 7),
        hashLength: user.password.length,
        isBcryptHash: user.password.startsWith('$2') // Bcrypt hashes start with $2
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};