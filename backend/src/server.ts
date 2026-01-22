// backend/src/server.ts - EMERGENCY FIX
import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

console.log("🚀 EMERGENCY SERVER STARTING");

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

/* ==================== 1. MANUAL BODY PARSER ==================== */
app.use((req: Request, res: Response, next: any) => {
  console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    let data = '';
    
    req.on('data', (chunk) => {
      data += chunk.toString();
    });
    
    req.on('end', () => {
      console.log('📝 Raw data:', data);
      
      // ALWAYS set body, NEVER throw error
      if (!data.trim()) {
        req.body = {};
      } else {
        try {
          req.body = JSON.parse(data);
          console.log('✅ JSON parsed:', req.body);
        } catch (error) {
          console.log('⚠️ JSON parse failed -> empty object');
          req.body = {};
        }
      }
      
      next();
    });
    
    req.on('error', () => {
      req.body = {};
      next();
    });
  } else {
    next();
  }
});

/* ==================== 2. CORS ==================== */
app.use(cors({
  origin: ["https://kiran-contact-management.netlify.app", "http://localhost:3000"],
  credentials: true
}));

/* ==================== 3. TEST ENDPOINTS ==================== */
app.get("/", (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: "Emergency Server",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "OK", 
    server: "Emergency",
    time: new Date().toISOString()
  });
});

// THIS ENDPOINT MUST WORK
app.post("/api/emergency-test", (req: Request, res: Response) => {
  console.log("✅ EMERGENCY TEST CALLED:", req.body);
  res.json({
    success: true,
    message: "Emergency endpoint works!",
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// SIMPLE LOGIN TEST
app.post("/api/auth/login-test", (req: Request, res: Response) => {
  console.log("✅ EMERGENCY LOGIN:", req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password required"
    });
  }
  
  res.json({
    success: true,
    message: "Emergency login works",
    token: "emergency-jwt-token",
    user: {
      id: 1,
      email: email,
      role: "admin"
    }
  });
});

/* ==================== 4. IMPORT ROUTES ==================== */
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

/* ==================== 5. START SERVER ==================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 EMERGENCY SERVER STARTED`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: https://contact-management-5ct3.onrender.com`);
  console.log(`🔧 Test: POST /api/emergency-test`);
  console.log(`🔑 Login: POST /api/auth/login-test`);
  console.log(`\n✅ Ready for testing!`);
});

export default app;