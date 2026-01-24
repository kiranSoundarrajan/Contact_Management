import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contactApi } from '../../api/contactApi';
import { ContactState, Contact, ContactFormData, ContactsResponse } from '../../types/contact.types';

/* =====================================================
   INITIAL STATE
===================================================== */
const initialState: ContactState = {
  contacts: [],
  allContactsCache: [],
  userContactsCache: [],
  selectedContact: null,
  loading: false,
  pageLoading: false,
  error: null,
  total: 0,
  totalPages: 1,
  currentPage: 1,
  isInitialized: false,
  lastFetchedPage: null,
  cacheTimestamp: null,
  syncTimestamp: null,
};

/* =====================================================
   🔹 FETCH USER CONTACTS
===================================================== */
export const fetchUserContacts = createAsyncThunk<
  ContactsResponse & { currentPage: number },
  { page?: number; limit?: number; search?: string; forceRefresh?: boolean }
>(
  'contacts/fetchUserContacts',
  async ({ page = 1, limit = 15, search = '', forceRefresh = false }, { rejectWithValue }) => {
    try {
      const response = await contactApi.getUserContacts({ page, limit, search, forceRefresh });
      return { ...response, currentPage: page };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user contacts');
    }
  }
);

/* =====================================================
   🔹 FETCH ADMIN CONTACTS
===================================================== */
export const fetchAdminContacts = createAsyncThunk<
  ContactsResponse & { currentPage: number },
  { page?: number; limit?: number; search?: string; forceRefresh?: boolean }
>(
  'contacts/fetchAdminContacts',
  async ({ page = 1, limit = 15, search = '', forceRefresh = false }, { rejectWithValue }) => {
    try {
      const response = await contactApi.getAllContacts({ page, limit, search, forceRefresh });
      return { ...response, currentPage: page };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin contacts');
    }
  }
);

/* =====================================================
   🔹 CREATE / UPDATE / DELETE CONTACTS
===================================================== */
export const createContact = createAsyncThunk<{ success: boolean; contact: Contact }, ContactFormData>(
  'contacts/createContact',
  async (data, { rejectWithValue }) => {
    try {
      return await contactApi.createContact(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create contact');
    }
  }
);

export const updateContact = createAsyncThunk<{ success: boolean; contact: Contact }, { id: number | string; data: ContactFormData }>(
  'contacts/updateContact',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await contactApi.updateContact(id.toString(), data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update contact');
    }
  }
);

export const deleteContact = createAsyncThunk<{ success: boolean; id: number | string }, number | string>(
  'contacts/deleteContact',
  async (id, { rejectWithValue }) => {
    try {
      await contactApi.deleteContact(id.toString());
      return { success: true, id };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete contact');
    }
  }
);

/* =====================================================
   SLICE
===================================================== */
const contactSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => { state.currentPage = action.payload; },
    setSelectedContact: (state, action: PayloadAction<Contact | null>) => { state.selectedContact = action.payload; },
    clearError: (state) => { state.error = null; },
    resetContacts: () => initialState,
    startPageLoading: (state) => { state.pageLoading = true; },
    stopPageLoading: (state) => { state.pageLoading = false; },
  },
  extraReducers: (builder) => {
    builder
      /* ===== USER ===== */
      .addCase(fetchUserContacts.pending, (state) => { state.loading = true; })
      .addCase(fetchUserContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload.contacts;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.isInitialized = true;
      })
      .addCase(fetchUserContacts.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      /* ===== ADMIN ===== */
      .addCase(fetchAdminContacts.pending, (state) => { state.loading = true; })
      .addCase(fetchAdminContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload.contacts;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.isInitialized = true;
      })
      .addCase(fetchAdminContacts.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      /* ===== CREATE / UPDATE / DELETE ===== */
      .addCase(createContact.fulfilled, (state) => { state.syncTimestamp = Date.now(); })
      .addCase(updateContact.fulfilled, (state, action) => {
        const idx = state.contacts.findIndex(c => c.id === action.payload.contact.id);
        if (idx !== -1) state.contacts[idx] = action.payload.contact;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter(c => c.id !== action.payload.id);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const { setPage, setSelectedContact, clearError, resetContacts, startPageLoading, stopPageLoading } = contactSlice.actions;
export default contactSlice.reducer;
