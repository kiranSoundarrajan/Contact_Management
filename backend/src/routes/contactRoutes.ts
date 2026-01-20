import { Router } from "express";
import {
  createContact,
  deleteContact,
  getContactById,
  getContacts,
  getUserContacts,
  updateContact
} from "../controllers/contactController";
import { authenticate, isAdmin, isUser } from "../middlewares/authMiddlewares";

const router = Router();

router.use(authenticate);

// User
router.post("/createContact", isUser, createContact);
router.get("/getUserContacts", isUser, getUserContacts);

// Admin
router.get("/getContacts", isAdmin, getContacts);
router.get("/getContactById/:id", isAdmin, getContactById);
router.put("/updateContact/:id", isAdmin, updateContact);
router.delete("/deleteContact/:id", isAdmin, deleteContact);

export default router;