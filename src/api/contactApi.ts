import axiosInstance from './axiosInstance';
import { Contact, ContactFormData, ContactsResponse } from '../types/contact.types';

export const contactApi = {
  // User endpoints
  createContact: async (contactData: ContactFormData): Promise<{ success: boolean; contact: Contact }> => {
    const response = await axiosInstance.post('/contacts/createContact', contactData);
    return response.data;
  },

  getUserContacts: async (page: number = 1, limit: number = 15): Promise<ContactsResponse> => {
    const response = await axiosInstance.get(`/contacts/getUserContacts?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Admin endpoints
  getAllContacts: async (page: number = 1, limit: number = 15, search: string = ''): Promise<ContactsResponse> => {
    const response = await axiosInstance.get(
      `/contacts/getContacts?page=${page}&limit=${limit}&search=${search}`
    );
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