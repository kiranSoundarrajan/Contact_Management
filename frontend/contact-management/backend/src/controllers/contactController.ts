import { Request, Response } from "express";
import {
  createContactService,
  getContactsService,
  updateContactService,
  deleteContactService,
  getContactByIdService
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create contact"
    });
  }
};

// ===============================
// 🔹 GET ALL CONTACTS (Admin)
// ===============================
export const getContacts = async (req: Request, res: Response) => {
  try {
    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;

    const limit =
      typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 15;

    const search =
      typeof req.query.search === "string" ? req.query.search : "";

    const result = await getContactsService(page, limit, search);

    res.json({
      success: true,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      contacts: result.contacts
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contacts"
    });
  }
};

// ===============================
// 🔹 GET USER CONTACTS (User)
// ===============================
export const getUserContacts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing"
      });
    }

    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;

    const limit =
      typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 15;

    const search =
      typeof req.query.search === "string" ? req.query.search : "";

    const result = await getContactsService(page, limit, search, userId);

    res.set("Cache-Control", "private, max-age=30");

    res.json({
      success: true,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      contacts: result.contacts
    });
  } catch (error: any) {
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
