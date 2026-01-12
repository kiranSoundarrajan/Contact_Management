export interface Contact {
  id: number;
  name: string;
  email: string;
  place: string;
  dob: string;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
  phone?: string;
  company?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  place: string;
  dob: string;
  phone?: string;
  company?: string;
}

export interface ContactsResponse {
  success: boolean;
  contacts: Contact[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ContactState {
  contacts: Contact[];
  selectedContact: Contact | null;
  loading: boolean;
  pageLoading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  currentPage: number;
}