import { Contact, ContactFormData, ContactsResponse } from '../types/contact.types';
import axiosInstance from './axiosInstance';

export const contactApi = {
  // ===============================
  // 🔹 USER ENDPOINTS
  // ===============================
  
  createContact: async (contactData: ContactFormData): Promise<{ success: boolean; contact: Contact }> => {
    const response = await axiosInstance.post('/contacts/createContact', contactData);
    return response.data;
  },

  getUserContacts: async (page: number = 1, limit: number = 15, search: string = ''): Promise<ContactsResponse> => {
    const response = await axiosInstance.get('/contacts/getUserContacts', {
      params: {
        page,
        limit,
        search
      }
    });
    return response.data;
  },

  // ===============================
  // 🔹 ADMIN ENDPOINTS
  // ===============================
  
  getAllContacts: async (page: number = 1, limit: number = 15, search: string = ''): Promise<ContactsResponse> => {
    const response = await axiosInstance.get('/contacts/getContacts', {  // Changed from getAdminContacts
      params: {
        page,
        limit,
        search
      }
    });
    return response.data;
  },

  // Remove duplicate or fix the endpoint name
  getAdminContacts: async (page: number = 1, limit: number = 15, search: string = ''): Promise<ContactsResponse> => {
    const response = await axiosInstance.get('/contacts/getAdminContacts', {
      params: {
        page,
        limit,
        search
      }
    });
    return response.data;
  },

  getContactById: async (id: number): Promise<{ success: boolean; contact: Contact }> => {
    const response = await axiosInstance.get(`/contacts/getContactById/${id}`);
    return response.data;
  },

  updateContact: async (id: number, contactData: Partial<ContactFormData>): Promise<{ success: boolean; contact: Contact }> => {
    const response = await axiosInstance.put(`/contacts/updateContact/${id}`, contactData);
    return response.data;
  },

  deleteContact: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/contacts/deleteContact/${id}`);
    return response.data;
  },
};