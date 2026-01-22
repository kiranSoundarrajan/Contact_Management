// import express, { Application, Request, Response, NextFunction } from "express";
// import dotenv from "dotenv";
// import bcrypt from "bcryptjs";
// import cors from "cors";
// import sequelize from "./config/db";
// import User from "./models/User";
// import authRoutes from "./routes/authRoutes";
// import contactRoutes from "./routes/contactRoutes";

// dotenv.config();

// console.log(`🚀 Starting server in ${process.env.NODE_ENV || "development"} mode`);

// /* -------------------- App Init -------------------- */
// const app: Application = express();

// /* -------------------- CORS Configuration -------------------- */
// const corsOptions = {
//   origin: ["https://kiran-contact-management.netlify.app", "http://localhost:3000"],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
// };

// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));

// /* -------------------- Middleware Order (VERY IMPORTANT) -------------------- */
// // 1. JSON body parser with increased limit
// app.use(express.json({ limit: '10mb' }));

// // 2. URL encoded parser
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // 3. Request logging middleware
// app.use((req: Request, res: Response, next: NextFunction) => {
//   console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
//   console.log('📋 Content-Type:', req.headers['content-type']);
//   console.log('📦 Body:', req.body);
//   console.log('---');
//   next();
// });

// /* -------------------- Error Handling Middleware -------------------- */
// // Handle JSON parsing errors
// // REMOVE or COMMENT OUT this entire error middleware:
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   if (err instanceof SyntaxError) {
//     console.error('❌ JSON Parse Error:', err.message);
//     return res.status(400).json({ 
//       success: false, 
//       message: 'Invalid JSON in request body',
//       error: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
//   next();
// });
// /* -------------------- Routes -------------------- */
// app.use("/api/auth", authRoutes);
// app.use("/api/contacts", contactRoutes);

// /* -------------------- Test Endpoints -------------------- */
// app.get("/", (req: Request, res: Response) => {
//   res.json({
//     success: true,
//     message: "Contact Management API",
//     version: "1.0.0",
//     timestamp: new Date().toISOString()
//   });
// });

// app.get("/health", (req: Request, res: Response) => {
//   res.json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//     service: "Contact Management API",
//     environment: process.env.NODE_ENV,
//     database: process.env.DB_NAME
//   });
// });

// app.get("/api/test", (req: Request, res: Response) => {
//   res.json({ 
//     success: true, 
//     message: "API is working!",
//     endpoint: "test"
//   });
// });

// app.post("/api/test-post", (req: Request, res: Response) => {
//   console.log("Test POST body received:", req.body);
//   res.json({ 
//     success: true, 
//     message: "POST request received",
//     body: req.body,
//     timestamp: new Date().toISOString()
//   });
// });

// /* -------------------- Admin Seed -------------------- */
// const createAdminIfNotExists = async (): Promise<void> => {
//   try {
//     const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
//     const adminPassword = process.env.ADMIN_PASSWORD?.trim();

//     if (!adminEmail || !adminPassword) {
//       console.warn("⚠️ Admin credentials not set");
//       return;
//     }

//     const adminExists = await User.findOne({ where: { email: adminEmail } });

//     if (!adminExists) {
//       const hashedPassword = await bcrypt.hash(adminPassword, 10);
//       await User.create({
//         username: "Admin",
//         email: adminEmail,
//         password: hashedPassword,
//         role: "admin"
//       });
//       console.log("✅ Admin user created");
//     } else {
//       console.log("✅ Admin user already exists");
//     }
//   } catch (error) {
//     console.error("❌ Error creating admin:", error);
//   }
// };

// /* -------------------- Database Sync -------------------- */
// const syncDatabase = async (): Promise<void> => {
//   try {
//     await sequelize.sync({ alter: false });
//     console.log("✅ Database synced");
//     await createAdminIfNotExists();
//   } catch (error) {
//     console.error("❌ Database sync failed:", error);
//   }
// };

// /* -------------------- Server Start -------------------- */
// const PORT: number = Number(process.env.PORT) || 5000;

// const startServer = async (): Promise<void> => {
//   try {
//     await sequelize.authenticate();
//     console.log("✅ Database connected");
//     await syncDatabase();
    
//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
//       console.log(`🌐 Health check: http://0.0.0.0:${PORT}/health`);
//       console.log(`📊 Database: ${process.env.DB_NAME}`);
//     });
//   } catch (error) {
//     console.error("❌ Server failed to start:", error);
//     process.exit(1);
//   }
// };

// startServer();

// export default app;


// src/server.ts - WITH ALL FIXES
import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db";
import User from "./models/User";

// Import bcryptjs properly
import bcrypt from "bcryptjs";

dotenv.config();

console.log(`🚀 Server starting in ${process.env.NODE_ENV || "development"} mode`);

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

/* ==================== 1. CORS ==================== */
const corsOptions = {
  origin: ["https://kiran-contact-management.netlify.app", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ==================== 2. BODY PARSER ==================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==================== 3. REQUEST LOGGING ==================== */
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n=== ${new Date().toISOString()} ===`);
  console.log(`${req.method} ${req.url}`);
  console.log("Headers:", {
    "content-type": req.headers["content-type"],
    origin: req.headers["origin"]
  });
  
  // Clone body to avoid reference issues
  const bodyCopy = req.body ? JSON.parse(JSON.stringify(req.body)) : {};
  console.log("Body:", bodyCopy);
  
  next();
});

/* ==================== 4. TEST ENDPOINTS ==================== */
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Contact Management API v2",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    service: "Contact Management",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db: process.env.DB_NAME
  });
});

// SIMPLE TEST GET
app.get("/api/simple-test", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Simple test endpoint is working",
    method: "GET"
  });
});

// SIMPLE TEST POST
app.post("/api/simple-test", (req: Request, res: Response) => {
  console.log("Simple test POST received:", req.body);
  res.json({
    success: true,
    message: "Simple test POST is working",
    method: "POST",
    body: req.body
  });
});

// DIRECT LOGIN TEST
app.post("/api/login-test", (req: Request, res: Response) => {
  console.log("DIRECT Login test called with body:", req.body);
  
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid request body"
    });
  }
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }
  
  res.json({
    success: true,
    message: "Direct login test successful",
    token: "direct-test-token",
    user: {
      id: 1,
      email: email,
      role: "admin"
    }
  });
});

/* ==================== 5. IMPORT YOUR ROUTES ==================== */
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

/* ==================== 6. 404 HANDLER ==================== */
app.use((req: Request, res: Response) => {
  console.log(`404: ${req.method} ${req.url} not found`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

/* ==================== 7. ADMIN SEED ==================== */
const createAdminIfNotExists = async (): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ Admin credentials not set");
      return;
    }

    console.log(`Checking admin: ${adminEmail}`);
    
    const adminExists = await User.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      console.log("Creating admin user...");
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await User.create({
        username: "Admin User",
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });
      
      console.log("✅ Admin user created successfully");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error: any) {
    console.error("❌ Error in admin seed:", error.message);
  }
};

/* ==================== 8. DATABASE ==================== */
const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    await sequelize.sync({ alter: false });
    console.log("✅ Database synced");
    
    await createAdminIfNotExists();
  } catch (error: any) {
    console.error("❌ Database error:", error.message);
  }
};

/* ==================== 9. START SERVER ==================== */
const startServer = async (): Promise<void> => {
  try {
    await syncDatabase();
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 SERVER STARTED SUCCESSFULLY`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 URL: https://contact-management-5ct3.onrender.com`);
      console.log(`🔧 Endpoints:`);
      console.log(`   GET  /health`);
      console.log(`   GET  /api/simple-test`);
      console.log(`   POST /api/simple-test`);
      console.log(`   POST /api/login-test`);
      console.log(`   POST /api/auth/login`);
      console.log(`\n✅ Ready for testing!`);
    });
  } catch (error: any) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;