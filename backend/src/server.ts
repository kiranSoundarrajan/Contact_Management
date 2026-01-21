import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cors, { CorsOptions } from "cors";

import sequelize from "./config/db";
import User from "./models/User";
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

// Determine which .env file to load
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: envFile });

console.log(`🚀 Starting server in ${process.env.NODE_ENV} mode`);
console.log(`📁 Using config: ${envFile}`);

const app: Application = express();

/* -------------------- CORS -------------------- */
const allowedOrigins: string[] = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

/* -------------------- Middlewares -------------------- */
app.use(express.json());

/* -------------------- Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

/* -------------------- Admin Seed -------------------- */
const createAdminIfNotExists = async (): Promise<void> => {
  try {
    const adminName = process.env.ADMIN_NAME || "Admin";
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ Admin credentials not set in .env");
      return;
    }

    const adminExists = await User.findOne({
      where: { email: adminEmail }
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await User.create({
        username: adminName,
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: "admin"
      });

      console.log("✅ Admin user created");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
};

/* -------------------- Database Sync -------------------- */
const syncDatabase = async (): Promise<void> => {
  try {
    const syncOptions =
      process.env.NODE_ENV === "development" ? { alter: false } : {};

    await sequelize.sync(syncOptions);
    console.log("✅ Database synced successfully");

    await createAdminIfNotExists();
  } catch (error) {
    console.error("❌ Database sync failed:", error);
    throw error;
  }
};

/* -------------------- Health Check -------------------- */
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Contact Management API",
    environment: process.env.NODE_ENV,
    database: process.env.DB_NAME
  });
});

/* -------------------- Database Info Endpoint -------------------- */
app.get("/api/db-info", (req: Request, res: Response) => {
  res.json({
    environment: process.env.NODE_ENV,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    dbPort: process.env.DB_PORT,
    dbUser: process.env.DB_USER
  });
});

/* -------------------- Server Start -------------------- */
const PORT: number = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await syncDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  }
};

/* -------------------- Global Error Handlers -------------------- */
process.on("uncaughtException", (error: Error) => {
  console.error("⚠️ Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("⚠️ Unhandled Rejection:", reason);
});

startServer();

export default app;
