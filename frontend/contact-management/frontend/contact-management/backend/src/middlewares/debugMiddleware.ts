import { Request, Response, NextFunction } from "express";

export const debugAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log("🔍 DEBUG MIDDLEWARE:");
  console.log("Headers:", req.headers);
  console.log("Authorization header:", req.headers.authorization);
  
  // Check if user is set by authenticate middleware
  const user = (req as any).user;
  console.log("User object:", user);
  console.log("User ID:", user?.userId);
  console.log("User Role:", user?.role);
  console.log("---");
  
  next();
};