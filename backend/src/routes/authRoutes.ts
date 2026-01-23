import { Router } from "express";
import { 
  register, 
  login, 
  createAdmin, 
  logout,
  resetPassword,
  checkUser,
  testEndpoint,
  testJsonParse,
  debugAuthFlow,
} from "../controllers/authController";

const router = Router();

// ===============================
// 🔹 AUTHENTICATION ROUTES
// ===============================
router.post("/register", register);
router.post("/login", login);
router.post("/createAdmin", createAdmin);
router.post("/logout", logout);
router.post("/reset-password", resetPassword);
router.post("/check-user", checkUser);
router.post("/test-json", testJsonParse);
router.post("/debug-auth-flow", debugAuthFlow);


// If you have adminLogin function, add it
// router.post("/admin-login", adminLogin);

// ===============================
// 🔹 TEST ROUTES
// ===============================
router.get("/test", testEndpoint);

export default router;