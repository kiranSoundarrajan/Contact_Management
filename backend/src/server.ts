// import express from "express";
// import dotenv from "dotenv";
// import bcrypt from "bcryptjs"; // ✅ Import bcrypt
// import cors from "cors"; // Add this import
// import User from "./models/User"; // ✅ Import User model
// import Contact from "./models/Contact";
// dotenv.config();

// import sequelize from "./config/db";
// import authRoutes from "./routes/authRoutes";
// import contactRoutes from "./routes/contactRoutes";

// const app = express();

// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://localhost:3000",
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));

// app.use((req, res, next) => {
//   const allowedOrigins = [
//     "http://localhost:3000",
//     "http://127.0.0.1:3000",
//     "http://localhost:5173", // Vite default
//   ];
//   const origin = req.headers.origin;
//   if (origin && allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//   }
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   next();
// });

// app.use(express.json());

// app.use("/api/auth", authRoutes);
// app.use("/api/contacts", contactRoutes);

// const PORT = process.env.PORT || 5000;

// // 🔹 Function to create admin if not exists
// const createAdminIfNotExists = async () => {
//   try {
//     const adminEmail = "kiransoundarrajan@gmail.com";
//     const adminExists = await User.findOne({ where: { email: adminEmail } });
    
//     if (!adminExists) {
//       const hashedPassword = await bcrypt.hash("1234567890", 10);
      
//       await User.create({
//         username: "Nakkeeran S",
//         email: adminEmail,
//         password: hashedPassword,
//         role: "admin" // ✅ Admin role set
//       });
      
//       console.log("✅ Admin user created successfully");
//       console.log("📧 Email: kiransoundarrajan@gmail.com");
//       console.log("🔑 Password: 1234567890");
//       console.log("👑 Role: admin");
//     } else {
//       console.log("✅ Admin user already exists");
//     }
//   } catch (error) {
//     console.error("❌ Error creating admin user:", error);
//   }
// };

// const syncDatabase = async () => {
//   try {
//     // Database sync
//     await sequelize.sync({ alter: true });
//     console.log("✅ Database synced successfully");

//     // Create admin user
//     await createAdminIfNotExists();

//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//     });
//   } catch (error) {
//     console.error("❌ Unable to sync database:", error);
//   }
// };

// syncDatabase();


import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cors from "cors";

import sequelize from "./config/db";
import User from "./models/User";
import authRoutes from "./routes/authRoutes";
import contactRoutes from "./routes/contactRoutes";

dotenv.config();

const app = express();

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
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
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("⚠️ Admin credentials not set in ENV");
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
};

/* -------------------- Server Start -------------------- */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // ⚠️ DEV / DEMO ONLY
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced");

    if (process.env.NODE_ENV === "production") {
      await createAdminIfNotExists();
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error);
  }
};

startServer();
