import { Router } from "express";
import { 
  register, 
  login, 
  createAdmin, 
  logout, 
  testEndpoint, 
  resetPassword, 
  checkUser,
  testJsonParse  // ADD THIS IMPORT
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/createAdmin", createAdmin);
router.post("/logout", logout);
router.post("/reset-password", resetPassword);
router.post("/check-user", checkUser);
router.post("/test-json", testJsonParse);  // ADD THIS LINE
router.get("/test", testEndpoint);

export default router;