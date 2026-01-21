import { Router } from "express";
import {
  createContact,
  deleteContact,
  getAdminContacts,
  getContactById,
  getContacts,
  getUserContacts,
  updateContact
} from "../controllers/contactController";
import { authenticate, isAdmin, isUser } from "../middlewares/authMiddlewares";

const router = Router();

// ===============================
// 🔹 USER ROUTES
// ===============================
router.post("/createContact", authenticate, isUser, createContact);
router.get("/getUserContacts", authenticate, isUser, getUserContacts);

// ===============================
// 🔹 ADMIN ROUTES  
// ===============================
router.get("/getContacts", authenticate, isAdmin, getContacts); // All contacts (admin)
router.get("/getAdminContacts", authenticate, isAdmin, getAdminContacts); // Admin view
router.get("/getContactById/:id", authenticate, isAdmin, getContactById);
router.put("/updateContact/:id", authenticate, isAdmin, updateContact);
router.delete("/deleteContact/:id", authenticate, isAdmin, deleteContact);

export default router;