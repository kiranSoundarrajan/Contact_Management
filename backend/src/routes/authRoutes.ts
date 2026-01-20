import { Router } from "express";
import { 
  register, 
  login, 
  createAdmin, 
  logout, 
  testEndpoint, 
  resetPassword, 
  checkUser 
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/createAdmin", createAdmin);
router.post("/logout", logout);
router.post("/reset-password", resetPassword); // Add this
router.post("/check-user", checkUser); // Add this
router.get("/test", testEndpoint);

export default router;