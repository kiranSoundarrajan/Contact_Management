import { Request, Response } from "express";
import {
  createContactService,
  getContactsService,
  updateContactService,
  deleteContactService,
  getContactByIdService,
  validateDOB
} from "../services/contactService";

// ===============================
// 🔹 CREATE CONTACT (User)
// ===============================
export const createContact = async (req: Request, res: Response) => {
  try {
    console.log("🔍 Request user object:", (req as any).user);
    console.log("🔍 Request body:", req.body);

    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing. Please login again."
      });
    }

    if (req.body.dob) {
      const dobValidation = validateDOB(req.body.dob);
      if (!dobValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: dobValidation.error
        });
      }
    }

    const contactData = {
      name: req.body.name,
      email: req.body.email,
      place: req.body.place,
      dob: req.body.dob,
      userId
    };

    console.log("📝 Creating contact with data:", contactData);

    const contact = await createContactService(contactData);

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      contact
    });
  } catch (error: any) {
    console.error("❌ Create contact error:", error);
    
    if (error.message.includes("Date of birth") || error.message.includes("future")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create contact"
    });
  }
};

// ===============================
// 🔹 GET ALL CONTACTS (Admin) - FIXED
// ===============================
export const getContacts = async (req: Request, res: Response) => {
  try {
    console.log(`\n🔍 GET ALL CONTACTS REQUEST ================`);
    console.log("Query params:", req.query);
    
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 15);
    const search = (req.query.search as string) || "";

    console.log(`Page: ${page}, Limit: ${limit}, Search: "${search}"`);

    const result = await getContactsService(page, limit, search);

    // 🛠️ FIX: Add pagination headers for frontend
    res.set({
      'X-Total-Count': result.total.toString(),
      'X-Total-Pages': result.totalPages.toString(),
      'X-Current-Page': page.toString(),
      'X-Per-Page': limit.toString()
    });

    res.json({
      success: true,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      hasNextPage: page < result.totalPages,
      hasPrevPage: page > 1,
      contacts: result.contacts
    });
    
    console.log(`✅ Sent ${result.contacts.length} contacts (page ${page} of ${result.totalPages})`);
  } catch (error: any) {
    console.error("❌ Get contacts error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contacts"
    });
  }
};

// ===============================
// 🔹 GET USER CONTACTS (User) - FIXED
// ===============================
export const getUserContacts = async (req: Request, res: Response) => {
  try {
    console.log(`\n🔍 GET USER CONTACTS REQUEST ================`);
    
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing"
      });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 15);
    const search = (req.query.search as string) || "";

    console.log(`User ID: ${userId}, Page: ${page}, Limit: ${limit}, Search: "${search}"`);

    const result = await getContactsService(page, limit, search, userId);

    // 🛠️ FIX: Add pagination headers
    res.set({
      'X-Total-Count': result.total.toString(),
      'X-Total-Pages': result.totalPages.toString(),
      'X-Current-Page': page.toString(),
      'X-Per-Page': limit.toString(),
      'Cache-Control': 'private, max-age=30'
    });

    res.json({
      success: true,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      hasNextPage: page < result.totalPages,
      hasPrevPage: page > 1,
      contacts: result.contacts
    });
    
    console.log(`✅ Sent ${result.contacts.length} contacts for user ${userId}`);
  } catch (error: any) {
    console.error("❌ Get user contacts error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contacts"
    });
  }
};

// ===============================
// 🔹 GET ADMIN CONTACTS (Admin only) - FIXED
// ===============================
export const getAdminContacts = async (req: Request, res: Response) => {
  try {
    console.log(`\n🔍 GET ADMIN CONTACTS REQUEST ================`);
    
    const user = (req as any).user;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 15);
    const search = (req.query.search as string) || "";

    console.log(`Admin ID: ${user.userId}, Page: ${page}, Limit: ${limit}, Search: "${search}"`);

    const result = await getContactsService(page, limit, search);

    // 🛠️ FIX: Add pagination headers
    res.set({
      'X-Total-Count': result.total.toString(),
      'X-Total-Pages': result.totalPages.toString(),
      'X-Current-Page': page.toString(),
      'X-Per-Page': limit.toString()
    });

    res.json({
      success: true,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      hasNextPage: page < result.totalPages,
      hasPrevPage: page > 1,
      contacts: result.contacts
    });
    
    console.log(`✅ Admin ${user.userId} received ${result.contacts.length} contacts`);
  } catch (error: any) {
    console.error("❌ Get admin contacts error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contacts"
    });
  }
};

// ===============================
// 🔹 UPDATE CONTACT (Admin)
// ===============================
export const updateContact = async (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);

    if (req.body.dob) {
      const dobValidation = validateDOB(req.body.dob);
      if (!dobValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: dobValidation.error
        });
      }
    }

    const updatedContact = await updateContactService(contactId, req.body);

    res.json({
      success: true,
      message: "Contact updated successfully",
      contact: updatedContact
    });
  } catch (error: any) {
    if (error.message === "Contact not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes("Date of birth") || error.message.includes("future")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update contact"
    });
  }
};

// ===============================
// 🔹 DELETE CONTACT (Admin)
// ===============================
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);

    await deleteContactService(contactId);

    res.json({
      success: true,
      message: "Contact deleted successfully"
    });
  } catch (error: any) {
    if (error.message === "Contact not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete contact"
    });
  }
};

// ===============================
// 🔹 GET CONTACT BY ID (Admin)
// ===============================
export const getContactById = async (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);

    const contact = await getContactByIdService(contactId);

    res.json({
      success: true,
      contact
    });
  } catch (error: any) {
    if (error.message === "Contact not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch contact"
    });
  }
};


