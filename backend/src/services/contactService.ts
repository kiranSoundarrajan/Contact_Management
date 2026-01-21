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
  page: number = 1,
  limit: number = 15,
  search: string = '',
  userId?: number
): Promise<PaginatedContacts> => {
  try {
    // 🛠️ FIX 1: Validate page number
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    
    const offset = (page - 1) * limit;

    console.log(`\n🔍 PAGINATION DEBUG ================`);
    console.log(`Page: ${page}`);
    console.log(`Limit: ${limit}`);
    console.log(`Offset: ${offset}`);
    console.log(`Search: "${search}"`);
    console.log(`UserId: ${userId}`);
    console.log(`====================================`);

    // 🛠️ FIX 2: Proper where condition
    const whereCondition: WhereOptions<ContactAttributes> = {};

    if (userId) {
      whereCondition.userId = userId;
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search}%`;
      (whereCondition as any)[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { place: { [Op.like]: searchTerm } }
      ];
    }

    console.log(`📊 WHERE CONDITION:`, JSON.stringify(whereCondition, null, 2));

    // 🛠️ FIX 3: Separate count and find queries for better performance
    const count = await Contact.count({ where: whereCondition });
    const rows = await Contact.findAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    const contacts = rows as ContactInstance[];
    
    const totalPages = Math.ceil(count / limit);
    
    console.log(`\n📊 PAGINATION RESULTS ================`);
    console.log(`Total records: ${count}`);
    console.log(`Total pages: ${totalPages}`);
    console.log(`Records returned: ${contacts.length}`);
    console.log(`Showing page ${page} of ${totalPages}`);
    console.log(`====================================\n`);

    // Update cache
    contacts.forEach(contact => {
      if (!contactCache.has(contact.id)) {
        contactCache.set(contact.id, contact);
      }
    });

    return {
      contacts,
      total: count,
      totalPages: totalPages
    };
  } catch (error: any) {
    console.error("❌ Get contacts error:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
};