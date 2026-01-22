import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cors from "cors";
import sequelize from "./config/db";
import User from "./models/User";
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

dotenv.config();

console.log(`🚀 Starting server in ${process.env.NODE_ENV || "development"} mode`);

/* -------------------- App Init -------------------- */
const app: Application = express();

/* -------------------- CORS Configuration -------------------- */
const corsOptions = {
  origin: ["https://kiran-contact-management.netlify.app", "http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* -------------------- Middleware Order (VERY IMPORTANT) -------------------- */
// 1. JSON body parser with increased limit
app.use(express.json({ limit: '10mb' }));

// 2. URL encoded parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📋 Content-Type:', req.headers['content-type']);
  console.log('📦 Body:', req.body);
  console.log('---');
  next();
});

/* -------------------- Error Handling Middleware -------------------- */
// Handle JSON parsing errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError) {
    console.error('❌ JSON Parse Error:', err.message);
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid JSON in request body',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next();
});

/* -------------------- Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

/* -------------------- Test Endpoints -------------------- */
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Contact Management API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Contact Management API",
    environment: process.env.NODE_ENV,
    database: process.env.DB_NAME
  });
});

app.get("/api/test", (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: "API is working!",
    endpoint: "test"
  });
});

app.post("/api/test-post", (req: Request, res: Response) => {
  console.log("Test POST body received:", req.body);
  res.json({ 
    success: true, 
    message: "POST request received",
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

/* -------------------- Admin Seed -------------------- */
const createAdminIfNotExists = async (): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ Admin credentials not set");
      return;
    }

    const adminExists = await User.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });
      console.log("✅ Admin user created");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
};

/* -------------------- Database Sync -------------------- */
const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: false });
    console.log("✅ Database synced");
    await createAdminIfNotExists();
  } catch (error) {
    console.error("❌ Database sync failed:", error);
  }
};

/* -------------------- Server Start -------------------- */
const PORT: number = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");
    await syncDatabase();
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🌐 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`📊 Database: ${process.env.DB_NAME}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  }
};

startServer();

export default app;