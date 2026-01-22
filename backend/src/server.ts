// server.ts - COMPLETE CLEAN VERSION
import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db";
import User from "./models/User";

dotenv.config();

console.log(`🚀 Server starting in ${process.env.NODE_ENV || "development"} mode`);

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

/* ==================== 1. CORS ==================== */
app.use(cors({
  origin: ["https://kiran-contact-management.netlify.app", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

/* ==================== 2. BODY PARSER - SIMPLE ==================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==================== 3. REQUEST LOGGER ==================== */
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("📋 Content-Type:", req.headers["content-type"]);
  
  // Clone body to log safely
  if (req.body && typeof req.body === "object") {
    const bodyCopy = { ...req.body };
    if (bodyCopy.password) bodyCopy.password = "***";
    console.log("📦 Body:", bodyCopy);
  } else {
    console.log("📦 Body:", req.body);
  }
  
  next();
});

/* ==================== 4. SUPER SIMPLE TEST ENDPOINT ==================== */
app.post("/api/debug-test", (req: Request, res: Response) => {
  console.log("✅ DEBUG TEST ENDPOINT CALLED");
  console.log("Request body:", req.body);
  console.log("Body type:", typeof req.body);
  
  res.json({
    success: true,
    message: "Debug endpoint working!",
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

/* ==================== 5. HEALTH ENDPOINTS ==================== */
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Contact Management API",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    service: "Contact Management",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/* ==================== 6. IMPORT ROUTES ==================== */
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

/* ==================== 7. 404 HANDLER ==================== */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

/* ==================== 8. START SERVER ==================== */
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    // Sync database
    await sequelize.sync({ alter: false });
    console.log("✅ Database synced");
    
    // Start server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 SERVER STARTED SUCCESSFULLY`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 URL: https://contact-management-5ct3.onrender.com`);
      console.log(`🔧 Test endpoint: POST /api/debug-test`);
      console.log(`🔑 Login endpoint: POST /api/auth/login`);
      console.log(`\n✅ Ready for requests!`);
    });
  } catch (error: any) {
    console.error("❌ Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;