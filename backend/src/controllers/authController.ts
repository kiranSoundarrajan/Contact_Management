import { Request, Response } from "express";
import { createAdminService, loginService, registerService } from "../services/authService";
import jwt from "jsonwebtoken";
import { blacklistToken } from "../middlewares/authMiddlewares";

// Define user interface
interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

const recentTokens = new Map<string, { userId: number, email: string, username: string }>();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    const user = await loginService(email, password) as UserData | null;

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    if (!user.id) {
      console.error("❌ User has no ID:", user);
      return res.status(500).json({ 
        success: false, 
        message: "User data is invalid" 
      });
    }

    // Check for recent token
    let existingToken: string | undefined;
    for (const [token, data] of recentTokens.entries()) {
      if (data.userId === user.id) {
        existingToken = token;
        break;
      }
    }

    let token: string;
    if (existingToken) {
      token = existingToken;
    } else {
      token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role 
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d" }
      );
      
      // Store in cache
      recentTokens.set(token, { 
        userId: user.id, 
        email: user.email,
        username: user.username
      });

      // Auto-cleanup
      setTimeout(() => {
        recentTokens.delete(token);
      }, 24 * 60 * 60 * 1000);
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username, // ✅ Added username
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.message.includes("Too many login attempts")) {
      return res.status(429).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    console.error("❌ Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Login failed" 
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const user = await registerService({ username, email, password, role }) as UserData;

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    // Store in cache
    recentTokens.set(token, { 
      userId: user.id, 
      email: user.email,
      username: user.username
    });

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
    console.error("❌ REGISTER CONTROLLER ERROR:", error.message);
    res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;
    
    if (!secretKey || secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: Invalid secret key" 
      });
    }
    
    const result = await createAdminService();
    
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
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
      recentTokens.delete(token);
      blacklistToken(token);
    }
    
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
};