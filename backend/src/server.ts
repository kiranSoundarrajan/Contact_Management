// server.ts
import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db";
import User from "./models/User";

// Routes
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

/* ==================== 1. GLOBAL MIDDLEWARE ==================== */

// JSON body parser (THIS IS ENOUGH ✅)
app.use(express.json());

// CORS
app.use(
  cors({
    origin: [
      "https://contact-management-23.netlify.app",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* ==================== 2. BASIC ROUTES ==================== */

app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Contact Management API",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/* ==================== 3. API ROUTES ==================== */

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

/* ==================== 4. 404 HANDLER ==================== */

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

/* ==================== 5. ERROR HANDLER ==================== */

app.use(
  (error: Error, req: Request, res: Response, next: Function) => {
    console.error("❌ Server Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
);

/* ==================== 6. DATABASE CONNECTION ==================== */

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync({ alter: false });
    console.log("✅ Database synced");

    // Ensure admin user exists
    const adminEmail =
      process.env.ADMIN_EMAIL || "kiransoundarrajan@gmail.com";
    const adminPassword =
      process.env.ADMIN_PASSWORD || "1234567890";

    const existingAdmin = await User.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      await User.create({
        username: "Nakkeeran S",
        email: adminEmail,
        password: adminPassword, // model hook will hash
        role: "admin",
      });
      console.log("✅ Admin user created");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

/* ==================== 7. START SERVER ==================== */

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await connectDB();
});

export default app;
