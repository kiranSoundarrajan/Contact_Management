

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  role?: string;
}

// In-memory token blacklist
const tokenBlacklist = new Set<string>();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: "Token missing" 
      });
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token missing" 
      });
    }
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ 
        success: false, 
        message: "Token revoked" 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    // Attach user to request
    (req as any).user = {
      userId: decoded.userId,
      role: decoded.role
    };
    
    console.log("✅ Authentication successful. User:", (req as any).user);
    
    next();
  } catch (error: any) {
    console.error("❌ Authentication error:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired" 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: "Authentication failed" 
    });
  }
};

// Role check middlewares
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }
  
  if (user.role !== "admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Admin only." 
    });
  }
  
  next();
};

export const isUser = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }
  
  if (user.role !== "user") {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. User only." 
    });
  }
  
  next();
};

// Function to blacklist token (for logout)
export const blacklistToken = (token: string) => {
  tokenBlacklist.add(token);
};

// 🔹 Optional: Add a simple test endpoint
export const testAuth = (req: Request, res: Response) => {
  const user = (req as any).user;
  
  res.json({
    success: true,
    message: "Authentication test",
    user: user || "No user found"
  });
};