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

export const createContactService = async (
  data: any
): Promise<any> => {
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

    const contact = await Contact.create(data);
    
    // Get the full contact with all fields
    const fullContact = await Contact.findByPk(contact.id);
    
    // Clear cache
    const cacheKey = `user_${userId}_contacts`;
    contactCache.delete(cacheKey);
    contactCache.delete('admin_all_contacts');

    return fullContact || contact;
  } catch (error: any) {
    console.error("❌ Create contact service error:", error.message);
    throw error;
  }
};

// Add missing service functions
export const getContactByIdService = async (
  contactId: number
): Promise<any> => {
  try {
    const contact = await Contact.findByPk(contactId);
    if (!contact) throw new Error("Contact not found");
    return contact;
  } catch (error: any) {
    console.error("❌ Get contact by ID error:", error.message);
    throw error;
  }
};

export const updateContactService = async (
  contactId: number,
  data: Partial<any>
): Promise<any> => {
  try {
    const contact = await Contact.findByPk(contactId);
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

    const updated = await contact.update(data);
    
    // Clear cache
    contactCache.clear();
    
    return updated;
  } catch (error: any) {
    console.error("❌ Update contact error:", error.message);
    throw error;
  }
};

export const deleteContactService = async (contactId: number): Promise<boolean> => {
  try {
    const contact = await Contact.findByPk(contactId);
    if (!contact) throw new Error("Contact not found");

    await contact.destroy();
    
    // Clear cache
    contactCache.clear();
    
    return true;
  } catch (error: any) {
    console.error("❌ Delete contact error:", error.message);
    throw error;
  }
};

export const getContactsService = async (
  page = 1,
  limit = 15,
  search = "",
  userId?: number
) => {
  const offset = (page - 1) * limit;
  const where: any = {};
  
  if (userId) {
    where.userId = userId;
    const cacheKey = `user_${userId}_page_${page}_search_${search}`;
    const cached = contactCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Returning cached user contacts for page ${page}`);
      return cached;
    }
  } else {
    const cacheKey = `admin_page_${page}_search_${search}`;
    const cached = contactCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Returning cached admin contacts for page ${page}`);
      return cached;
    }
  }
  
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { place: { [Op.like]: `%${search}%` } }
    ];
  }

  const total = await Contact.count({ where });
  const contacts = await Contact.findAll({ 
    where, 
    limit, 
    offset, 
    order: [["id", "DESC"]] 
  });

  const result = { 
    contacts, 
    total, 
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
  
  if (userId) {
    contactCache.set(`user_${userId}_page_${page}_search_${search}`, result);
  } else {
    contactCache.set(`admin_page_${page}_search_${search}`, result);
  }
  
  return result;
};