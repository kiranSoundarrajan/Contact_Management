import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contactApi } from '../../api/contactApi';
import { ContactState, Contact, ContactFormData } from '../../types/contact.types';

const initialState: ContactState = {
  contacts: [],
  selectedContact: null,
  loading: false,
  pageLoading: false,
  error: null,
  total: 0,
  totalPages: 1,
  currentPage: 1,
};

export const fetchUserContacts = createAsyncThunk(
  'contacts/fetchUserContacts',
  async ({ page = 1, limit = 15 }: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await contactApi.getUserContacts(page, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contacts');
    }
  }
);

export const fetchAllContacts = createAsyncThunk(
  'contacts/fetchAllContacts',
  async (
    { page = 1, limit = 15, search = '' }: { page?: number; limit?: number; search?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await contactApi.getAllContacts(page, limit, search);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contacts');
    }
  }
);

export const createContact = createAsyncThunk(
  'contacts/createContact',
  async (contactData: ContactFormData, { rejectWithValue }) => {
    try {
      const response = await contactApi.createContact(contactData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create contact');
    }
  }
);

export const updateContact = createAsyncThunk(
  'contacts/updateContact',
  async ({ id, data }: { id: number; data: Partial<ContactFormData> }, { rejectWithValue }) => {
    try {
      const response = await contactApi.updateContact(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update contact');
    }
  }
);

export const deleteContact = createAsyncThunk(
  'contacts/deleteContact',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await contactApi.deleteContact(id);
      return { id, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete contact');
    }
  }
);

const contactSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    clearSelectedContact: (state) => {
      state.selectedContact = null;
    },
    setSelectedContact: (state, action: PayloadAction<Contact>) => {
      state.selectedContact = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // 🌟 SMOOTH PAGINATION REDUCERS
    startPageLoading: (state) => {
      state.pageLoading = true;
    },
    stopPageLoading: (state) => {
      state.pageLoading = false;
    },
    resetContacts: (state) => {
      state.contacts = [];
      state.pageLoading = false;
      state.loading = false;
    },
    // 🌟 For immediate page change without loading
    changePageInstant: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Contacts
      .addCase(fetchUserContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserContacts.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.pageLoading = false;
        state.contacts = action.payload.contacts;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchUserContacts.rejected, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.error = action.payload as string;
      })
      // Fetch All Contacts (Admin) - SMOOTH VERSION
      .addCase(fetchAllContacts.pending, (state) => {
        // Don't set loading immediately for smooth transitions
        if (!state.pageLoading) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchAllContacts.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.pageLoading = false;
        state.contacts = action.payload.contacts;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAllContacts.rejected, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.error = action.payload as string;
      })
      // Create Contact
      .addCase(createContact.pending, (state) => {
        state.loading = true;
      })
      .addCase(createContact.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.contacts.unshift(action.payload.contact);
        state.total += 1;
        // Recalculate total pages
        state.totalPages = Math.ceil(state.total / 15);
      })
      .addCase(createContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Contact
      .addCase(updateContact.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateContact.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const index = state.contacts.findIndex(c => c.id === action.payload.contact.id);
        if (index !== -1) {
          state.contacts[index] = action.payload.contact;
        }
        state.selectedContact = null;
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Contact
      .addCase(deleteContact.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteContact.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.contacts = state.contacts.filter(contact => contact.id !== action.payload.id);
        state.total -= 1;
        // Recalculate total pages
        state.totalPages = Math.ceil(state.total / 15);
        // If current page is empty and not first page, go to previous page
        if (state.contacts.length === 0 && state.currentPage > 1) {
          state.currentPage -= 1;
        }
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearSelectedContact, 
  setSelectedContact, 
  clearError,
  startPageLoading,
  stopPageLoading,
  resetContacts,
  changePageInstant,
} = contactSlice.actions;

export default contactSlice.reducer;