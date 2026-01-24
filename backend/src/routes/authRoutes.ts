import { Router } from "express";
import { 
  register, 
  login, 
  createAdmin, 
  logout,
  

} from "../controllers/authController";

const router = Router();

// ===============================
// 🔹 AUTHENTICATION ROUTES
// ===============================
router.post("/register", register);
router.post("/login", login);
router.post("/createAdmin", createAdmin);
router.post("/logout", logout);





export default router;