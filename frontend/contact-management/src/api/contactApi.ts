import { Contact, ContactFormData, ContactsResponse } from '../types/contact.types';
import axiosInstance from './axiosInstance';

export const contactApi = {
  createContact: async (contactData: ContactFormData): Promise<{ success: boolean; contact: Contact }> => {
    const response = await axiosInstance.post('/contacts/createContact', contactData);
    return response.data;
  },

  getUserContacts: async ({
    page = 1,
    limit = 15,
    search = '',
    forceRefresh = false
  }: {
    page?: number;
    limit?: number;
    search?: string;
    forceRefresh?: boolean;
  }): Promise<ContactsResponse> => {
    const response = await axiosInstance.get('/contacts/getUserContacts', {
      params: { page, limit, search, forceRefresh },
    });
    return response.data;
  },

  getAllContacts: async ({
    page = 1,
    limit = 15,
    search = '',
    forceRefresh = false
  }: {
    page?: number;
    limit?: number;
    search?: string;
    forceRefresh?: boolean;
  }): Promise<ContactsResponse> => {
    const response = await axiosInstance.get('/contacts/getContacts', {
      params: { page, limit, search, forceRefresh },
    });
    return response.data;
  },

  updateContact: async (id: string, contactData: ContactFormData): Promise<{ success: boolean; contact: Contact }> => {
    const response = await axiosInstance.put(`/contacts/updateContact/${id}`, contactData);
    return response.data;
  },

  deleteContact: async (id: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete(`/contacts/deleteContact/${id}`);
    return response.data;
  },

  getContact: async (id: string): Promise<{ success: boolean; contact: Contact }> => {
    const response = await axiosInstance.get(`/contacts/getContact/${id}`);
    return response.data;
  },

  syncContacts: async (): Promise<{ success: boolean; timestamp: number }> => {
    const response = await axiosInstance.post('/contacts/syncContacts');
    return response.data;
  },
};
