import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  createAdminService,
  loginService,
  registerService,
} from "../services/authService";
import { blacklistToken } from "../middlewares/authMiddlewares";

// ===================== LOGIN =====================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email and password must be strings",
      });
    }

    const user = await loginService(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

// ===================== REGISTER =====================
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields must be strings",
      });
    }

    const user = await registerService({ username, email, password, role });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// ===================== CREATE ADMIN =====================
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;

    if (!secretKey || secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Invalid secret key",
      });
    }

    const result = await createAdminService();

    return res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Create admin failed",
    });
  }
};

// ===================== LOGOUT =====================
export const logout = (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      blacklistToken(token);
    }

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

// ===================== CHECK USER (OPTIONAL / DEBUG) =====================
export const checkUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

   
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Check user failed",
    });
  }
};
