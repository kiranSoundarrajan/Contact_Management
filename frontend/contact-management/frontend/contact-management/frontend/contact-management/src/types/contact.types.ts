export interface Contact {
  id: number;
  name: string;
  email: string;
  place: string;
  dob: string;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  place: string;
  dob: string;
}

export interface ContactsResponse {
  success: boolean;
  contacts: Contact[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface ContactState {
  contacts: Contact[];
  selectedContact: Contact | null;
  loading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  currentPage: number;
}