import { Request, Response } from "express";
import {
  createContactService,
  getContactsService,
  updateContactService,
  deleteContactService,
  getContactByIdService,
  validateDOB,
} from "../services/contactService";

// ---------- Helper ----------
const formatContact = (contact: any) => {
  const plain = contact.get ? contact.get({ plain: true }) : contact;
  return {
    id: plain.id,
    name: plain.name,
    email: plain.email,
    place: plain.place,
    dob: plain.dob,
    userId: plain.userId,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

// ---------- Create Contact ----------
export const createContact = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "User not authenticated" });

    if (req.body.dob) {
      const { isValid, error } = validateDOB(req.body.dob);
      if (!isValid) return res.status(400).json({ success: false, message: error });
    }

    const contact = await createContactService({ ...req.body, userId });
    res.status(201).json({ success: true, contact: formatContact(contact) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Get User Contacts ----------
export const getUserContacts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "User not authenticated" });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const search = (req.query.search as string) || "";

    const result = await getContactsService(page, limit, search, userId);
    res.json({
      success: true,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      contacts: result.contacts.map(formatContact),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Get All Contacts (Admin) ----------
export const getContacts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const search = (req.query.search as string) || "";

    const result = await getContactsService(page, limit, search);
    res.json({
      success: true,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      contacts: result.contacts.map(formatContact),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Update Contact ----------
export const updateContact = async (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);

    if (req.body.dob) {
      const { isValid, error } = validateDOB(req.body.dob);
      if (!isValid) return res.status(400).json({ success: false, message: error });
    }

    const updated = await updateContactService(contactId, req.body);
    res.json({ success: true, contact: formatContact(updated) });
  } catch (error: any) {
    res.status(error.message === "Contact not found" ? 404 : 500).json({ success: false, message: error.message });
  }
};

// ---------- Delete Contact ----------
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    await deleteContactService(contactId);
    res.json({ success: true, message: "Contact deleted successfully", id: contactId });
  } catch (error: any) {
    res.status(error.message === "Contact not found" ? 404 : 500).json({ success: false, message: error.message });
  }
};

// ---------- Get Contact By ID ----------
export const getContactById = async (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    const contact = await getContactByIdService(contactId);
    res.json({ success: true, contact: formatContact(contact) });
  } catch (error: any) {
    res.status(error.message === "Contact not found" ? 404 : 500).json({ success: false, message: error.message });
  }
};
