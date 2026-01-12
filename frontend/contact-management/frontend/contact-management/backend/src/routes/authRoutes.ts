import { Router } from "express";
import { register, login, createAdmin, logout } from "../controllers/authController";

const router = Router();
router.post("/register", register);
router.post("/createAdmin", createAdmin);
router.post("/login", login);
router.post("/logout", logout);

export default router;