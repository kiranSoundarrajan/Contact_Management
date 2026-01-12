import Contact from "../models/Contact";
import { Op } from "sequelize";
import { ContactInstance } from "../types/sequelize";

const contactCache = new Map<number, ContactInstance>();

// ===============================
// 🔹 DOB VALIDATION FUNCTION
// ===============================
export const validateDOB = (dobString: string) => {
  try {
    if (!dobString) {
      return { isValid: true }; // Empty DOB is handled by schema
    }

    const dob = new Date(dobString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is valid
    if (isNaN(dob.getTime())) {
      return {
        isValid: false,
        error: "Invalid date format"
      };
    }

    // Check if date is in future
    if (dob > today) {
      return {
        isValid: false,
        error: "Date of birth cannot be in the future"
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "Invalid date format"
    };
  }
};

// ===============================
// 🔹 CREATE CONTACT SERVICE
// ===============================
export const createContactService = async (data: any): Promise<ContactInstance> => {
  try {
    console.log("🛠️ Service creating contact with data:", data);
    
    // Validate required fields
    if (!data.name || !data.email || !data.place || !data.dob) {
      throw new Error("Missing required fields: name, email, place, dob");
    }
    
    if (!data.userId) {
      throw new Error("User ID is required to create a contact");
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Invalid email format");
    }
    
    // Validate date of birth (not in future)
    const dobValidation = validateDOB(data.dob);
    if (!dobValidation.isValid) {
      throw new Error(dobValidation.error || "Invalid date of birth");
    }
    
    const contact = await Contact.create(data) as ContactInstance;
    
    contactCache.set(contact.id, contact);
    
    return contact;
  } catch (error: any) {
    console.error("❌ Create contact service error:", error.message);
    throw error;
  }
};

export const getContactByIdService = async (contactId: number): Promise<ContactInstance> => {
  try {
    if (contactCache.has(contactId)) {
      return contactCache.get(contactId)!;
    }
    
    const contact = await Contact.findByPk(contactId) as ContactInstance | null;
    if (!contact) throw new Error("Contact not found");
    
    contactCache.set(contactId, contact);
    return contact;
  } catch (error: any) {
    console.error("❌ Get contact by ID error:", error.message);
    throw error;
  }
};

export const updateContactService = async (contactId: number, data: any): Promise<ContactInstance> => {
  try {
    const contact = await Contact.findByPk(contactId) as ContactInstance | null;
    if (!contact) throw new Error("Contact not found");
    
    // Validate email if being updated
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error("Invalid email format");
      }
    }
    
    // Validate date of birth if being updated (not in future)
    if (data.dob) {
      const dobValidation = validateDOB(data.dob);
      if (!dobValidation.isValid) {
        throw new Error(dobValidation.error || "Invalid date of birth");
      }
    }
    
    const updated = await contact.update(data) as ContactInstance;
    
    contactCache.set(contactId, updated);
    return updated;
  } catch (error: any) {
    console.error("❌ Update contact error:", error.message);
    throw error;
  }
};

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

export const getContactsService = async (
  page: number = 1, 
  limit: number = 15, 
  search: string = '', 
  userId?: number
) => {
  try {
    const offset = (page - 1) * limit;
    
    const whereCondition: any = {};
    
    if (userId) {
      whereCondition.userId = userId;
      console.log(`🔍 Filtering by userId: ${userId}`);
    }
    
    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { place: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows } = await Contact.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']]
    });
    
    const contacts = rows as ContactInstance[];
    
    contacts.forEach(contact => {
      if (!contactCache.has(contact.id)) {
        contactCache.set(contact.id, contact);
      }
    });
    
    return {
      contacts,
      total: count,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error: any) {
    console.error("❌ Get contacts error:", error.message);
    throw error;
  }
};