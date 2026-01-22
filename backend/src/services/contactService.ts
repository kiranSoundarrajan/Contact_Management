import Contact from "../models/Contact";
import { Op, WhereOptions } from "sequelize";
import { ContactInstance, ContactCreationAttributes, ContactAttributes } from "../types/sequelize";

// ===============================
// 🔹 Contact Cache
// ===============================
const contactCache = new Map<number, ContactInstance>();

// ===============================
// 🔹 Pagination Type
// ===============================
interface PaginatedContacts {
  contacts: ContactInstance[];
  total: number;
  totalPages: number;
}

// ===============================
// 🔹 DOB VALIDATION FUNCTION
// ===============================
export const validateDOB = (dobString: string) => {
  if (!dobString) return { isValid: true };
  const dob = new Date(dobString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(dob.getTime())) return { isValid: false, error: "Invalid date format" };
  if (dob > today) return { isValid: false, error: "Date of birth cannot be in the future" };
  
  return { isValid: true };
};

// ===============================
// 🔹 CREATE CONTACT SERVICE
// ===============================
export const createContactService = async (
  data: ContactCreationAttributes
): Promise<ContactInstance> => {
  try {
    const { name, email, place, dob, userId } = data;
    if (!name || !email || !place || !dob) {
      throw new Error("Missing required fields: name, email, place, dob");
    }
    if (!userId) throw new Error("User ID is required to create a contact");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Invalid email format");

    const dobValidation = validateDOB(dob.toString());
    if (!dobValidation.isValid) throw new Error(dobValidation.error);
    data.dob = new Date(dob);

    const contact = await Contact.create(data) as ContactInstance;
    contactCache.set(contact.id, contact);

    return contact;
  } catch (error: any) {
    console.error("❌ Create contact service error:", error.message);
    throw error;
  }
};

// ===============================
// 🔹 GET CONTACT BY ID
// ===============================
export const getContactByIdService = async (
  contactId: number
): Promise<ContactInstance> => {
  try {
    const cached = contactCache.get(contactId);
    if (cached) return cached;

    const contact = await Contact.findByPk(contactId) as ContactInstance | null;
    if (!contact) throw new Error("Contact not found");

    contactCache.set(contactId, contact);
    return contact;
  } catch (error: any) {
    console.error("❌ Get contact by ID error:", error.message);
    throw error;
  }
};

// ===============================
// 🔹 UPDATE CONTACT SERVICE
// ===============================
export const updateContactService = async (
  contactId: number,
  data: Partial<ContactCreationAttributes>
): Promise<ContactInstance> => {
  try {
    const contact = await Contact.findByPk(contactId) as ContactInstance | null;
    if (!contact) throw new Error("Contact not found");

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) throw new Error("Invalid email format");
    }

    if (data.dob) {
      const dobValidation = validateDOB(data.dob.toString());
      if (!dobValidation.isValid) throw new Error(dobValidation.error);
      data.dob = new Date(data.dob);
    }

    const updated = await contact.update(data) as ContactInstance;
    contactCache.set(contactId, updated);
    return updated;
  } catch (error: any) {
    console.error("❌ Update contact error:", error.message);
    throw error;
  }
};

// ===============================
// 🔹 DELETE CONTACT SERVICE
// ===============================
export const deleteContactService = async (contactId: number): Promise<boolean> => {
  try {
    const contact = await Contact.findByPk(contactId) as ContactInstance | null;
    if (!contact) throw new Error("Contact not found");

    await contact.destroy();
    contactCache.delete(contactId);
    return true;
  } catch (error: any) {
    console.error("❌ Delete contact error:", error.message);
    throw error;
  }
};

// ===============================
// 🔹 GET CONTACTS WITH SEARCH & PAGINATION (FIXED)
// ===============================
export const getContactsService = async (
  page = 1,
  limit = 15,
  search = "",
  userId?: number
) => {
  const offset = (page - 1) * limit;
  const where: any = {};
  if (userId) where.userId = userId;
  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];

  const total = await Contact.count({ where });
  const contacts = await Contact.findAll({ where, limit, offset, order: [["id", "DESC"]] });

  return { contacts, total, totalPages: Math.ceil(total / limit) };
};
