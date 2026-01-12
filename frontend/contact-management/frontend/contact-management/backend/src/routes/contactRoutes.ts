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

// Public routes (no auth required)
// No routes here currently

// Apply auth middleware to all contact routes
router.use(authenticate);

// Debug route to check authentication
router.get("/test-auth", (req, res) => {
  res.json({
    success: true,
    user: (req as any).user
  });
});

// User routes
router.post("/createContact", isUser, createContact);
router.get("/getUserContacts", isUser, getUserContacts);

// Admin routes
router.get("/getContacts", isAdmin, getContacts);
router.get("/getContactById/:id", isAdmin, getContactById);
router.put("/updateContact/:id", isAdmin, updateContact);
router.delete("/deleteContact/:id", isAdmin, deleteContact);

export default router;