import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contactApi } from '../../api/contactApi';
import {
  ContactState,
  Contact,
  ContactFormData,
  ContactsResponse,
} from '../../types/contact.types';
import { RootState, AppDispatch } from '../store';

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

interface EnhancedContactsResponse extends ContactsResponse {
  forceRefresh?: boolean;
  sync?: boolean;
  viewType?: 'user' | 'admin';
}

/* =====================================================
   🔹 FETCH USER CONTACTS (User + Admin)
===================================================== */
export const fetchUserContacts = createAsyncThunk<
  EnhancedContactsResponse,
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
        sync = false,
        search = '',
      } = params;

      const state = getState();
      const userRole = state.auth.user?.role;

      /* ================= API ================= */
      let response: ContactsResponse;

      if (userRole === 'admin') {
        response = await contactApi.getAllContacts(page, limit, search);
      } else {
        response = await contactApi.getUserContacts(page, limit, search);
      }

      return {
        ...response,
        success: true,
        forceRefresh,
        sync,
        viewType: userRole === 'admin' ? 'admin' : 'user',
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
  EnhancedContactsResponse,
  {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
    sync?: boolean;
    search?: string;
  }
>(
  'contacts/fetchAllContacts',
  async (params, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        limit = 15,
        search = '',
        forceRefresh = false,
        sync = false,
      } = params;

      // FIX: Use getAllContacts for admin
      const response = await contactApi.getAllContacts(page, limit, search);

      return {
        ...response,
        success: true,
        forceRefresh,
        sync,
        viewType: 'admin',
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
   🔹 CREATE CONTACT
===================================================== */
export const createContact = createAsyncThunk<
  { success: boolean; contact: Contact },
  ContactFormData
>('contacts/createContact', async (data, { dispatch }) => {
  const response = await contactApi.createContact(data);

  // Use AppDispatch type for the dispatch
  const typedDispatch = dispatch as AppDispatch;
  
  setTimeout(() => {
    typedDispatch(fetchUserContacts({ page: 1, forceRefresh: true }));
  }, 100);

  return response;
});

/* =====================================================
   🔹 UPDATE CONTACT
===================================================== */
export const updateContact = createAsyncThunk<
  { success: boolean; contact: Contact },
  { id: number; data: Partial<ContactFormData> }
>('contacts/updateContact', async ({ id, data }, { dispatch }) => {
  const response = await contactApi.updateContact(id, data);

  // Use AppDispatch type for the dispatch
  const typedDispatch = dispatch as AppDispatch;
  
  setTimeout(() => {
    typedDispatch(fetchUserContacts({ page: 1, forceRefresh: true }));
  }, 100);

  return response;
});

/* =====================================================
   🔹 DELETE CONTACT
===================================================== */
export const deleteContact = createAsyncThunk<
  { id: number; success: boolean; message: string },
  number
>('contacts/deleteContact', async (id, { dispatch }) => {
  const response = await contactApi.deleteContact(id);

  // Use AppDispatch type for the dispatch
  const typedDispatch = dispatch as AppDispatch;
  
  setTimeout(() => {
    typedDispatch(fetchUserContacts({ page: 1, forceRefresh: true }));
  }, 100);

  return { id, ...response };
});

/* =====================================================
   🔹 SLICE
===================================================== */
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

        // Only cache first page data
        if (action.payload.currentPage === 1) {
          if (action.payload.viewType === 'admin') {
            state.allContactsCache = action.payload.contacts;
          } else {
            state.userContactsCache = action.payload.contacts;
          }
        }

        if (action.payload.sync) {
          state.syncTimestamp = Date.now();
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

        // Only cache first page for admin
        if (action.payload.currentPage === 1) {
          state.allContactsCache = action.payload.contacts;
        }

        if (action.payload.sync) {
          state.syncTimestamp = Date.now();
        }

        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchAllContacts.rejected, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.error = action.payload as string;
      })
      
      // Handle syncContactsFromCache
      .addCase(syncContactsFromCache.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.syncTimestamp = action.payload.timestamp;
        }
      })
      
      // Handle createContact
      .addCase(createContact.pending, (state) => {
        state.loading = true;
      })
      .addCase(createContact.fulfilled, (state) => {
        state.loading = false;
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
        // Update selected contact if it's the one being edited
        if (state.selectedContact?.id === action.payload.contact.id) {
          state.selectedContact = action.payload.contact;
        }
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
        // Remove from cache if exists
        state.allContactsCache = state.allContactsCache.filter(
          contact => contact.id !== action.payload.id
        );
        state.userContactsCache = state.userContactsCache.filter(
          contact => contact.id !== action.payload.id
        );
        
        // Clear selected contact if it was deleted
        if (state.selectedContact?.id === action.payload.id) {
          state.selectedContact = null;
        }
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete contact';
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
  setPage
} = contactSlice.actions;

export default contactSlice.reducer;