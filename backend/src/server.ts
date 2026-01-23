// server.ts
import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db";
import User from "./models/User";

dotenv.config();

console.log("🚀 ULTIMATE SERVER STARTING");

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

/* ==================== 1. DEBUG MIDDLEWARE ==================== */
app.use((req: Request, res: Response, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  console.log('📋 Headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length']
  });
  
  // Capture request body
  let data = '';
  req.on('data', (chunk: Buffer) => {
    data += chunk.toString();
  });
  
  req.on('end', () => {
    if (data && data.trim() !== '') {
      console.log('📝 Raw body received:', data);
      console.log('📏 Body length:', data.length);
      
      // Check if it's JSON
      if (req.headers['content-type']?.includes('application/json')) {
        try {
          req.body = JSON.parse(data);
          console.log('✅ Parsed JSON body:', req.body);
        } catch (error: any) {
          console.error('❌ JSON parse error:', error.message);
          console.log('⚠️  Body is not valid JSON, keeping as string');
          req.body = data;
        }
      } else {
        console.log('⚠️  Not JSON content-type, body:', data);
        req.body = data;
      }
    } else {
      console.log('📭 No body received or empty body');
      req.body = {};
    }
    next();
  });
});

/* ==================== 2. CORS ==================== */
app.use(cors({
  origin: ["https://contact-management-23.netlify.app", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.options("*", cors());

/* ==================== 3. TEST ENDPOINTS ==================== */
app.get("/", (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: "Contact Management API",
    version: "3.0.0",
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

// ULTIMATE TEST WITH DEBUG
app.post("/api/ultimate-test", (req: Request, res: Response) => {
  console.log("✅ ULTIMATE TEST CALLED");
  console.log("Request body:", req.body);
  console.log("Body type:", typeof req.body);
  
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No body received",
      received: req.body
    });
  }
  
  res.json({
    success: true,
    message: "Ultimate test works!",
    body: req.body,
    bodyType: typeof req.body,
    timestamp: new Date().toISOString()
  });
});

// SIMPLE LOGIN TEST
app.post("/api/auth/simple-login", (req: Request, res: Response) => {
  console.log("✅ SIMPLE LOGIN CALLED");
  console.log("Login body:", req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
      received: req.body
    });
  }
  
  res.json({
    success: true,
    message: "Simple login successful",
    token: "simple-jwt-token",
    user: {
      id: 1,
      email: email,
      role: "admin"
    }
  });
});

/* ==================== 4. YOUR ROUTES ==================== */
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

/* ==================== 5. 404 HANDLER ==================== */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

/* ==================== 6. ERROR HANDLER ==================== */
app.use((error: Error, req: Request, res: Response, next: Function) => {
  console.error("❌ Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

/* ==================== 7. DATABASE CONNECTION ==================== */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    await sequelize.sync({ alter: false });
    console.log("✅ Database synced");
    
    // Create admin if not exists
    const adminEmail = process.env.ADMIN_EMAIL || "kiransoundarrajan@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "1234567890";
    
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await User.create({
        username: "Nakkeeran S",
        email: adminEmail,
        password: adminPassword,
        role: "admin"
      });
      console.log("✅ Admin user created");
    } else {
      console.log("✅ Admin user exists");
      
      // Update admin password if needed
      await existingAdmin.update({ password: adminPassword });
      console.log("✅ Admin password updated");
    }
  } catch (error) {
    console.error("❌ Database error:", error);
  }
};

/* ==================== 8. START SERVER ==================== */
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`\n🚀 ULTIMATE SERVER STARTED`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: https://contact-management-5ct3.onrender.com`);
  console.log(`🔧 Test: POST /api/ultimate-test`);
  console.log(`🔑 Login: POST /api/auth/simple-login`);
  console.log(`\n✅ Ready for testing!`);
  
  await connectDB();
});

export default app;