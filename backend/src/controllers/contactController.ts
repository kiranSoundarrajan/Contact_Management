// controllers/contactController.ts - CORRECTED VERSION
import { Request, Response } from "express";
import {
  createContactService,
  getContactsService,
  updateContactService,
  deleteContactService,
  getContactByIdService,
  validateDOB,
} from "../services/contactService";

// Define type for contact with timestamps
interface ContactWithTimestamps {
  id: number;
  name: string;
  email: string;
  place: string;
  dob: Date;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to safely access contact properties
const getContactData = (contact: any): ContactWithTimestamps => {
  // Convert to plain object if it's a Sequelize model
  const plainContact = contact.get ? contact.get({ plain: true }) : contact;
  
  return {
    id: plainContact.id,
    name: plainContact.name,
    email: plainContact.email,
    place: plainContact.place,
    dob: plainContact.dob,
    userId: plainContact.userId,
    createdAt: plainContact.createdAt,
    updatedAt: plainContact.updatedAt
  };
};

// Create contact - FIXED
export const createContact = async (req: Request, res: Response) => {
  try {
    console.log("\n🔍 CREATE CONTACT REQUEST ================");
    console.log("User object:", (req as any).user);
    console.log("Request body:", req.body);

    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing. Please login again."
      });
    }

    // Validate date of birth
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
    const contactResponse = getContactData(contact); // ✅ Use helper function

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      contact: contactResponse
    });
  } catch (error: any) {
    console.error("❌ CREATE CONTACT ERROR:", error.message);
    
    if (error.message.includes("Date of birth") || error.message.includes("future") || error.message.includes("Invalid email")) {
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

// Get user contacts - FIXED
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

    // Format contacts using helper function
    const formattedContacts = result.contacts.map((contact: any) => getContactData(contact));

    res.json({
      success: true,
      message: "Contacts fetched successfully",
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      hasNextPage: page < result.totalPages,
      hasPrevPage: page > 1,
      contacts: formattedContacts
    });
    
    console.log(`✅ Sent ${formattedContacts.length} contacts for user ${userId}`);
  } catch (error: any) {
    console.error("❌ GET USER CONTACTS ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contacts"
    });
  }
};

// Get all contacts (admin) - FIXED
export const getContacts = async (req: Request, res: Response) => {
  try {
    console.log(`\n🔍 GET ALL CONTACTS REQUEST (ADMIN) ================`);
    console.log("User object:", (req as any).user);
    
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

    // Format contacts using helper function
    const formattedContacts = result.contacts.map((contact: any) => getContactData(contact));

    res.json({
      success: true,
      message: "Contacts fetched successfully",
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      hasNextPage: page < result.totalPages,
      hasPrevPage: page > 1,
      contacts: formattedContacts
    });
    
    console.log(`✅ Admin ${user.userId} received ${formattedContacts.length} contacts`);
  } catch (error: any) {
    console.error("❌ GET ALL CONTACTS ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contacts"
    });
  }
};

// Update contact - FIXED
export const updateContact = async (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    
    console.log(`\n🔍 UPDATE CONTACT REQUEST ================`);
    console.log(`Contact ID: ${contactId}`);
    console.log("Update data:", req.body);

    // Validate date of birth
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
    const contactResponse = getContactData(updatedContact); // ✅ Use helper function

    res.json({
      success: true,
      message: "Contact updated successfully",
      contact: contactResponse
    });
  } catch (error: any) {
    console.error("❌ UPDATE CONTACT ERROR:", error.message);
    
    if (error.message === "Contact not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes("Date of birth") || error.message.includes("Invalid email")) {
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

// Delete contact - FIXED
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    
    console.log(`\n🔍 DELETE CONTACT REQUEST ================`);
    console.log(`Contact ID: ${contactId}`);

    await deleteContactService(contactId);

    res.json({
      success: true,
      message: "Contact deleted successfully"
    });
  } catch (error: any) {
    console.error("❌ DELETE CONTACT ERROR:", error.message);
    
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

// Get contact by ID - FIXED
export const getContactById = async (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    
    console.log(`\n🔍 GET CONTACT BY ID REQUEST ================`);
    console.log(`Contact ID: ${contactId}`);

    const contact = await getContactByIdService(contactId);
    const contactResponse = getContactData(contact); // ✅ Use helper function

    res.json({
      success: true,
      message: "Contact fetched successfully",
      contact: contactResponse
    });
  } catch (error: any) {
    console.error("❌ GET CONTACT BY ID ERROR:", error.message);
    
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

export const getAdminContacts = async (req: Request, res: Response) => {
  try {
    console.log(`\n🔍 GET ADMIN CONTACTS REQUEST ================`);
    console.log("User object:", (req as any).user);
    
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

    // Format contacts using helper function
    const formattedContacts = result.contacts.map((contact: any) => getContactData(contact));

    res.json({
      success: true,
      message: "Admin contacts fetched successfully",
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      hasNextPage: page < result.totalPages,
      hasPrevPage: page > 1,
      contacts: formattedContacts
    });
    
    console.log(`✅ Admin ${user.userId} received ${formattedContacts.length} contacts via getAdminContacts`);
  } catch (error: any) {
    console.error("❌ GET ADMIN CONTACTS ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admin contacts"
    });
  }
};