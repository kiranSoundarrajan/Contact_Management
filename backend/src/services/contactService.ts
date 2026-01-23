import Contact from "../models/Contact";
import { Op } from "sequelize";

export const contactCache = new Map<string, any>();

export const validateDOB = (dobString: string) => {
  if (!dobString) return { isValid: true };
  const dob = new Date(dobString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(dob.getTime())) return { isValid: false, error: "Invalid date format" };
  if (dob > today) return { isValid: false, error: "Date of birth cannot be in the future" };
  
  return { isValid: true };
};

export const createContactService = async (data: any) => {
  try {
    console.log("\n📝 CREATE CONTACT SERVICE START");
    console.log("Data received:", data);
    
    const { name, email, place, dob, userId } = data;
    
    // Validate required fields
    if (!name || !email || !place || !dob || !userId) {
      throw new Error("Missing required fields: name, email, place, dob, userId");
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate date of birth
    const dobValidation = validateDOB(dob.toString());
    if (!dobValidation.isValid) {
      throw new Error(dobValidation.error);
    }
    
    // Create contact
    const contact = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      place: place.trim(),
      dob: new Date(dob),
      userId: parseInt(userId.toString())
    });
    
    console.log("✅ Contact created with ID:", contact.id);
    
    // Clear cache for this user
    const cacheKey = `user_${userId}_contacts`;
    contactCache.delete(cacheKey);
    contactCache.delete('admin_all_contacts');

    return contact;
  } catch (error: any) {
    console.error("❌ CREATE CONTACT SERVICE ERROR:", error.message);
    throw error;
  }
};

export const getContactByIdService = async (contactId: number) => {
  try {
    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }
    return contact;
  } catch (error: any) {
    console.error("❌ GET CONTACT BY ID ERROR:", error.message);
    throw error;
  }
};

export const updateContactService = async (contactId: number, data: Partial<any>) => {
  try {
    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Validate email if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error("Invalid email format");
      }
      data.email = data.email.toLowerCase().trim();
    }

    // Validate date of birth if provided
    if (data.dob) {
      const dobValidation = validateDOB(data.dob.toString());
      if (!dobValidation.isValid) {
        throw new Error(dobValidation.error);
      }
      data.dob = new Date(data.dob);
    }

    // Update contact
    const updated = await contact.update(data);
    
    // Clear cache
    contactCache.clear();
    
    return updated;
  } catch (error: any) {
    console.error("❌ UPDATE CONTACT ERROR:", error.message);
    throw error;
  }
};

export const deleteContactService = async (contactId: number) => {
  try {
    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    await contact.destroy();
    
    // Clear cache
    contactCache.clear();
    
    return true;
  } catch (error: any) {
    console.error("❌ DELETE CONTACT ERROR:", error.message);
    throw error;
  }
};

export const getContactsService = async (page = 1, limit = 15, search = "", userId?: number) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};
    
    // Filter by user if provided
    if (userId) {
      where.userId = userId;
    }
    
    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { place: { [Op.like]: `%${search}%` } }
      ];
    }

    // Get total count
    const total = await Contact.count({ where });
    
    // Get contacts with pagination
    const contacts = await Contact.findAll({ 
      where, 
      limit, 
      offset, 
      order: [["createdAt", "DESC"]] 
    });

    const result = { 
      contacts, 
      total, 
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
    
    console.log(`✅ Found ${total} contacts, showing ${contacts.length} on page ${page}`);
    
    return result;
  } catch (error: any) {
    console.error("❌ GET CONTACTS SERVICE ERROR:", error.message);
    throw error;
  }
};