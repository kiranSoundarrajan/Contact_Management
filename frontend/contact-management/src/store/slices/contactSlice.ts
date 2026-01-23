import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contactApi } from '../../api/contactApi';
import {
  ContactState,
  Contact,
  ContactFormData,
  ContactsResponse,
} from '../../types/contact.types';
import { RootState } from '../store'; // Import RootState

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
  lastFetchedPage: null,
  cacheTimestamp: null,
  syncTimestamp: null,
  isInitialized: false,
};

/* =====================================================
   🔹 CREATE CONTACT - FIXED
===================================================== */
export const createContact = createAsyncThunk<
  { success: boolean; contact: Contact },
  ContactFormData,
  { state: RootState }
>('contacts/createContact', async (data, { dispatch, getState }) => {
  const response = await contactApi.createContact(data);
  
  // Immediately update local state
  const state = getState();
  const { currentPage } = state.contacts; // Remove unused 'total' variable
  
  // If on page 1, refresh immediately
  if (currentPage === 1) {
    dispatch(fetchUserContacts({ page: 1, forceRefresh: true }));
  } else {
    // If not on page 1, show toast and let user refresh
    dispatch(setSyncTimestamp(Date.now()));
  }
  
  return response;
});

/* =====================================================
   🔹 FETCH USER CONTACTS - FIXED
===================================================== */
export const fetchUserContacts = createAsyncThunk<
  ContactsResponse & { forceRefresh?: boolean },
  {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
    sync?: boolean;
    search?: string;
  },
  { state: RootState }
>(
  'contacts/fetchUserContacts',
  async (params, { rejectWithValue, getState }) => {
    try {
      const {
        page = 1,
        limit = 15,
        forceRefresh = false,
        search = '',
      } = params;

      const state = getState();
      const userRole = state.auth.user?.role;
      
      let response: ContactsResponse;
      
      if (userRole === 'admin') {
        response = await contactApi.getAllContacts(page, limit, search);
      } else {
        response = await contactApi.getUserContacts(page, limit, search);
      }
      
      return {
        ...response,
        forceRefresh,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch contacts'
      );
    }
  }
);

/* =====================================================
   🔹 FETCH ALL CONTACTS (ADMIN) - FIXED
===================================================== */
export const fetchAllContacts = createAsyncThunk<
  ContactsResponse & { forceRefresh?: boolean },
  {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
    search?: string;
  }
>(
  'contacts/fetchAllContacts',
  async (params, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        limit = 15,
        forceRefresh = false,
        search = '',
      } = params;

      const response = await contactApi.getAllContacts(page, limit, search);
      
      return {
        ...response,
        forceRefresh,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch contacts'
      );
    }
  }
);

/* =====================================================
   🔹 SYNC CONTACTS
===================================================== */
export const syncContactsFromCache = createAsyncThunk<
  { success: boolean; timestamp: number },
  void,
  { state: RootState }
>('contacts/syncContactsFromCache', async (_, { getState }) => {
  try {
    const state = getState();
    const role = state.auth.user?.role;

    // Perform API calls directly without nested dispatches
    if (role === 'admin') {
      await contactApi.getAllContacts(1, 15, '');
    } else {
      await contactApi.getUserContacts(1, 15, '');
    }

    return { success: true, timestamp: Date.now() };
  } catch {
    return { success: false, timestamp: Date.now() };
  }
});

/* =====================================================
   🔹 UPDATE CONTACT
===================================================== */
export const updateContact = createAsyncThunk<
  { success: boolean; contact: Contact },
  { id: number; data: Partial<ContactFormData> }
>('contacts/updateContact', async ({ id, data }) => {
  const response = await contactApi.updateContact(id, data);
  return response;
});

/* =====================================================
   🔹 DELETE CONTACT
===================================================== */
export const deleteContact = createAsyncThunk<
  { id: number; success: boolean; message: string },
  number
>('contacts/deleteContact', async (id) => {
  const response = await contactApi.deleteContact(id);
  return { id, ...response };
});

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
    resetContacts: () => initialState,
    startPageLoading: (state) => {
      state.pageLoading = true;
    },
    stopPageLoading: (state) => {
      state.pageLoading = false;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setSyncTimestamp: (state, action: PayloadAction<number>) => {
      state.syncTimestamp = action.payload;
    },
    // NEW: Add contact immediately to state
    addContactToState: (state, action: PayloadAction<Contact>) => {
      state.contacts = [action.payload, ...state.contacts];
      state.total += 1;
      
      // Also add to cache if on page 1
      if (state.currentPage === 1) {
        state.userContactsCache = [action.payload, ...state.userContactsCache.slice(0, 14)];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserContacts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.contacts = action.payload.contacts;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.lastFetchedPage = action.payload.currentPage;
        
        // Cache first page based on user role
        if (action.payload.currentPage === 1) {
          // Use state.contacts directly since we can't access auth state here
          // The caching logic will be handled by the thunk
          state.userContactsCache = action.payload.contacts;
        }
        
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchUserContacts.rejected, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchAllContacts
      .addCase(fetchAllContacts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.contacts = action.payload.contacts;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.lastFetchedPage = action.payload.currentPage;
        
        // Cache first page for admin
        if (action.payload.currentPage === 1) {
          state.allContactsCache = action.payload.contacts;
        }
        
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchAllContacts.rejected, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.error = action.payload as string;
      })
      
      // Handle createContact
      .addCase(createContact.pending, (state) => {
        state.loading = true;
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.loading = false;
        // Add contact to beginning of list if on page 1
        if (state.currentPage === 1) {
          state.contacts = [action.payload.contact, ...state.contacts.slice(0, 14)];
          state.total += 1;
        }
        state.syncTimestamp = Date.now();
      })
      .addCase(createContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create contact';
      })
      
      // Handle updateContact
      .addCase(updateContact.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.loading = false;
        // Update contact in the list if it exists
        const index = state.contacts.findIndex(c => c.id === action.payload.contact.id);
        if (index !== -1) {
          state.contacts[index] = action.payload.contact;
        }
        // Also update in cache if present
        const cacheIndex = state.userContactsCache.findIndex(c => c.id === action.payload.contact.id);
        if (cacheIndex !== -1) {
          state.userContactsCache[cacheIndex] = action.payload.contact;
        }
        state.syncTimestamp = Date.now();
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update contact';
      })
      
      // Handle deleteContact
      .addCase(deleteContact.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from contacts list
        state.contacts = state.contacts.filter(contact => contact.id !== action.payload.id);
        state.total -= 1;
        // Remove from cache
        state.userContactsCache = state.userContactsCache.filter(
          contact => contact.id !== action.payload.id
        );
        state.allContactsCache = state.allContactsCache.filter(
          contact => contact.id !== action.payload.id
        );
        state.syncTimestamp = Date.now();
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete contact';
      })
      
      // Handle syncContactsFromCache
      .addCase(syncContactsFromCache.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.syncTimestamp = action.payload.timestamp;
        }
      });
  },
});

export const {
  clearSelectedContact,
  setSelectedContact,
  clearError,
  resetContacts,
  startPageLoading,
  stopPageLoading,
  setPage,
  setSyncTimestamp,
  addContactToState
} = contactSlice.actions;

export default contactSlice.reducer;