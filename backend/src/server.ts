import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cors from "cors";
import sequelize from "./config/db";
import User from "./models/User";
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

dotenv.config();

console.log(`🚀 Starting server in ${process.env.NODE_ENV || "development"} mode`);
console.log(`📊 Connecting DB: ${process.env.DB_NAME}`);

/* -------------------- App Init -------------------- */
const app: Application = express();

/* -------------------- Enhanced CORS -------------------- */
const isDevelopment = process.env.NODE_ENV !== 'production';

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "https://kiran-contact-management.netlify.app"
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // In development, allow all origins
    if (isDevelopment) {
      callback(null, true);
      return;
    }
    
    // In production, check against allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

/* -------------------- Middlewares -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add CORS headers manually as fallback
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && (isDevelopment || allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

/* -------------------- Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

/* -------------------- Admin Seed -------------------- */
const createAdminIfNotExists = async (): Promise<void> => {
  try {
    const adminName = process.env.ADMIN_NAME || "Admin";
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ Admin credentials not set in environment variables");
      return;
    }

    const adminExists = await User.findOne({
      where: { email: adminEmail }
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await User.create({
        username: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });

      console.log("✅ Admin user created successfully");
    } else {
      // ✅ Admin exists but role wrong na update pannidum
      if (adminExists.role !== "admin") {
        adminExists.role = "admin";
        await adminExists.save();
        console.log("✅ Admin user role updated to admin");
      } else {
        console.log("✅ Admin user already exists");
      }
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
};

/* -------------------- Database Sync -------------------- */
const syncDatabase = async (): Promise<void> => {
  try {
    // ✅ Production la alter false avoid (safe)
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