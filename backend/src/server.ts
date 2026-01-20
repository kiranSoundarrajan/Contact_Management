


import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";   
import cors from "cors";
import path from "path";

import sequelize from "./config/db";
import User from "./models/User";
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

// Determine which .env file to load
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ path: envFile });

console.log(`🚀 Starting server in ${process.env.NODE_ENV} mode`);
console.log(`📁 Using config: ${envFile}`);

const app = express();

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
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
  })
);

/* -------------------- Middlewares -------------------- */
app.use(express.json());

/* -------------------- Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

/* -------------------- Admin Seed -------------------- */
const createAdminIfNotExists = async () => {
  try {
    const adminName = process.env.ADMIN_NAME || 'Admin';
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ Admin credentials not set in .env");
      return;
    }

    console.log(`🔍 Checking for admin user with email: ${adminEmail}`);

    const adminExists = await User.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      console.log("🔄 Creating admin user...");
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await User.create({
        username: adminName,
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: "admin"
      });

      console.log("✅ Admin user created:");
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Username: ${adminName}`);
      console.log(`   Role: admin`);
    } else {
      console.log("✅ Admin user already exists");
      console.log(`   ID: ${adminExists.id}`);
      console.log(`   Email: ${adminExists.email}`);
      console.log(`   Role: ${adminExists.role}`);
    }
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
  }
};

/* -------------------- Database Sync -------------------- */
/* -------------------- Database Sync -------------------- */
const syncDatabase = async () => {
  try {
    console.log("🔄 Syncing database...");
    
    // FIX THIS: Change from { alter: true } to { alter: false }
    const syncOptions = process.env.NODE_ENV === 'development' 
      ? { alter: false }  // CHANGE THIS LINE!
      : {};
    
    await sequelize.sync(syncOptions);
    console.log("✅ Database synced successfully");
    
    // Create admin after sync
    await createAdminIfNotExists();
    
  } catch (error: any) {
    console.error("❌ Database sync failed:", error.message);
    throw error;
  }
};

/* -------------------- Health Check -------------------- */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Contact Management API",
    environment: process.env.NODE_ENV,
    database: process.env.DB_NAME
  });
});

/* -------------------- Database Info Endpoint -------------------- */
app.get("/api/db-info", (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    dbPort: process.env.DB_PORT,
    dbUser: process.env.DB_USER
  });
});

/* -------------------- Server Start -------------------- */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log(`✅ Database connection established to ${process.env.DB_NAME}`);

    // Sync database
    await syncDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📊 Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 DB Info: http://localhost:${PORT}/api/db-info`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

export default app;