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

// Create
export const createContactService = async (data: any) => {
  const { name, email, place, dob, userId } = data;
  if (!name || !email || !place || !dob || !userId) throw new Error("Missing required fields");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new Error("Invalid email format");

  const contact = await Contact.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    place: place.trim(),
    dob: new Date(dob),
    userId: Number(userId),
  });

  contactCache.clear();
  return contact;
};

// Get by ID
export const getContactByIdService = async (contactId: number) => {
  const contact = await Contact.findByPk(contactId);
  if (!contact) throw new Error("Contact not found");
  return contact;
};

// Update
export const updateContactService = async (contactId: number, data: any) => {
  const contact = await Contact.findByPk(contactId);
  if (!contact) throw new Error("Contact not found");

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) throw new Error("Invalid email format");
    data.email = data.email.toLowerCase().trim();
  }

  if (data.dob) {
    const { isValid, error } = validateDOB(data.dob);
    if (!isValid) throw new Error(error);
    data.dob = new Date(data.dob);
  }

  const updated = await contact.update(data);
  contactCache.clear();
  return updated;
};

// Delete
export const deleteContactService = async (contactId: number) => {
  const contact = await Contact.findByPk(contactId);
  if (!contact) throw new Error("Contact not found");
  await contact.destroy();
  contactCache.clear();
  return true;
};

// Get contacts (user/admin)
export const getContactsService = async (
  page = 1,
  limit = 15,
  search = "",
  userId?: number
) => {
  const offset = (page - 1) * limit;
  const where: any = {};
  if (userId) where.userId = userId;
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { place: { [Op.like]: `%${search}%` } },
    ];
  }

  const total = await Contact.count({ where });
  const contacts = await Contact.findAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return { contacts, total, totalPages: Math.ceil(total / limit), currentPage: page };
};
