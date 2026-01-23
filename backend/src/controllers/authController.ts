import { Request, Response } from "express";
import { createAdminService, loginService, registerService } from "../services/authService";
import jwt from "jsonwebtoken";
import { blacklistToken } from "../middlewares/authMiddlewares";
import User from "../models/User";
import bcrypt from "bcryptjs";

export const login = async (req: Request, res: Response) => {
  try {
    console.log("\n🔍 LOGIN ENDPOINT HIT ================");
    console.log("Headers:", req.headers);
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Body:", req.body);
    console.log("Body type:", typeof req.body);
    console.log("======================================");
    
    // Check if body exists
    if (!req.body) {
      console.log("❌ ERROR: req.body is undefined");
      return res.status(400).json({
        success: false,
        message: "Request body is missing"
      });
    }
    
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      console.log("❌ Missing email or password");
      console.log("Email:", email);
      console.log("Password:", password ? "***" : "undefined");
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }
    
    console.log("✅ Email and password received");
    
    // Call the service
    const user = await loginService(email, password);
    
    if (!user) {
      console.log("❌ Login service returned null");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log("✅ Login service successful, generating token");

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    console.log("✅ LOGIN SUCCESSFUL ================");
    console.log("User:", user.email);
    console.log("Role:", user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
    
  } catch (error: any) {
    console.error("❌ LOGIN ERROR DETAILS:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

// NEW: Admin login endpoint
export const adminLogin = async (req: Request, res: Response) => {
  try {
    console.log("\n🔍 ADMIN LOGIN ENDPOINT ================");
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }
    
    // Special admin login
    const adminEmail = process.env.ADMIN_EMAIL || "kiransoundarrajan@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "1234567890";
    
    if (email === adminEmail && password === adminPassword) {
      // Find or create admin user
      let admin = await User.findOne({ where: { email: adminEmail } });
      
      if (!admin) {
        // Create admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        admin = await User.create({
          username: "Nakkeeran S",
          email: adminEmail,
          password: hashedPassword,
          role: "admin"
        });
      }
      
      // Generate token
      const token = jwt.sign(
        { 
          userId: admin.id, 
          email: admin.email,
          role: "admin" 
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d" }
      );
      
      console.log("✅ ADMIN LOGIN SUCCESSFUL");
      
      res.json({
        success: true,
        token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: "admin",
        },
      });
    } else {
      // Try normal login
      const user = await loginService(email, password);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
      
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d" }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    }
    
  } catch (error: any) {
    console.error("❌ ADMIN LOGIN ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    console.log("\n📝 REGISTER ATTEMPT ================");
    console.log("Request body:", req.body);
    
    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password) {
      console.log("❌ Missing fields");
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    console.log("👤 Username:", username);
    console.log("📧 Email:", email);
    console.log("🔑 Password length:", password.length);
    console.log("🎭 Role:", role);

    const user = await registerService({ username, email, password, role });

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    console.log("✅ REGISTRATION SUCCESSFUL");
    console.log("User created:", user.email);

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

// NEW: Reset password endpoint for debugging
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
    
    // Update password - will be hashed by the hook
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

// NEW: Check user endpoint
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
    console.log("Password hash:", user.password);
    console.log("Hash type:", user.password.substring(0, 7));
    console.log("Hash length:", user.password.length);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        passwordHash: user.password,
        hashType: user.password.substring(0, 7),
        hashLength: user.password.length
      }
    });
    
  } catch (error: any) {
    console.error("❌ CHECK USER ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const testEndpoint = async (req: Request, res: Response) => {
  console.log("✅ Test endpoint called");
  res.json({
    success: true,
    message: "Auth routes are working",
    timestamp: new Date().toISOString()
  });
};

// ADD THIS NEW TEST FUNCTION
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