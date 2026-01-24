import { Request, Response, NextFunction } from "express";

export const debugAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "development") {
    return next();
  }

  const user = (req as any).user;

  console.log("🔍 Auth Debug:", {
    userId: user?.userId,
    role: user?.role,
  });

  next();
};
