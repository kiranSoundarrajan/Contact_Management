import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contactApi } from '../../api/contactApi';
import {
  ContactState,
  Contact,
  ContactFormData,
  ContactsResponse,
} from '../../types/contact.types';
import { RootState } from '../store';

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
   🔹 FETCH ALL CONTACTS (ADMIN)
===================================================== */
export const fetchAllContacts = createAsyncThunk<
  ContactsResponse & { forceRefresh?: boolean },
  {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
    search?: string;
  },
  { state: RootState }
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
        error.response?.data?.message || 'Failed to fetch all contacts'
      );
    }
  }
);

/* =====================================================
   🔹 CREATE CONTACT - FIXED FOR IMMEDIATE UI UPDATE
===================================================== */
export const createContact = createAsyncThunk<
  { success: boolean; contact: Contact },
  ContactFormData,
  { state: RootState }
>('contacts/createContact', async (data, { dispatch }) => {
  const response = await contactApi.createContact(data);
  
  // IMMEDIATELY dispatch action to add to state
  dispatch(addContactToState(response.contact));
  
  // Also refresh from server after a delay
  setTimeout(() => {
    dispatch(fetchUserContacts({ page: 1, forceRefresh: true }));
  }, 1000);
  
  return response;
});

/* =====================================================
   🔹 UPDATE CONTACT
===================================================== */
export const updateContact = createAsyncThunk<
  { success: boolean; contact: Contact },
  { id: string | number; data: ContactFormData },
  { state: RootState }
>(
  'contacts/updateContact',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // Convert id to string if it's a number
      const contactId = typeof id === 'number' ? id.toString() : id;
      const response = await contactApi.updateContact(contactId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update contact'
      );
    }
  }
);

/* =====================================================
   🔹 DELETE CONTACT
===================================================== */
export const deleteContact = createAsyncThunk<
  { success: boolean; id: string | number },
  string | number,
  { state: RootState }
>(
  'contacts/deleteContact',
  async (id, { rejectWithValue }) => {
    try {
      // Convert id to string if it's a number
      const contactId = typeof id === 'number' ? id.toString() : id;
      const response = await contactApi.deleteContact(contactId);
      return { ...response, id };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete contact'
      );
    }
  }
);

/* =====================================================
   🔹 FETCH USER CONTACTS
===================================================== */
export const fetchUserContacts = createAsyncThunk<
  ContactsResponse & { forceRefresh?: boolean },
  {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
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
   🔹 SYNC CONTACTS FROM CACHE
===================================================== */
export const syncContactsFromCache = createAsyncThunk<
  { success: boolean; timestamp: number },
  void,
  { state: RootState }
>(
  'contacts/syncContactsFromCache',
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState();
      const userRole = state.auth.user?.role;
      
      // Force refresh all contacts
      if (userRole === 'admin') {
        await dispatch(fetchAllContacts({ page: 1, forceRefresh: true }));
      } else {
        await dispatch(fetchUserContacts({ page: 1, forceRefresh: true }));
      }
      
      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to sync contacts'
      );
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
    // 🚨 CRITICAL: Add contact immediately to state
    addContactToState: (state, action: PayloadAction<Contact>) => {
      state.contacts = [action.payload, ...state.contacts];
      state.total += 1;
      state.syncTimestamp = Date.now();
      
      // Update cache if on page 1
      if (state.currentPage === 1) {
        state.userContactsCache = [action.payload, ...state.userContactsCache.slice(0, 14)];
      }
    },
  },
  extraReducers: (builder) => {
    builder
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
        state.syncTimestamp = Date.now();
      })
      .addCase(fetchAllContacts.rejected, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchUserContacts
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
        
        // Cache first page
        if (action.payload.currentPage === 1) {
          state.userContactsCache = action.payload.contacts;
        }
        
        state.isInitialized = true;
        state.error = null;
        state.syncTimestamp = Date.now();
      })
      .addCase(fetchUserContacts.rejected, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.error = action.payload as string;
      })
      
      // Handle createContact - IMMEDIATE UI UPDATE
      .addCase(createContact.pending, (state) => {
        state.loading = true;
      })
      .addCase(createContact.fulfilled, (state) => {
        state.loading = false;
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
        // Update selected contact if it's the one being edited
        if (state.selectedContact?.id === action.payload.contact.id) {
          state.selectedContact = action.payload.contact;
        }
        state.syncTimestamp = Date.now();
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update contact';
      })
      
      // Handle deleteContact
      .addCase(deleteContact.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.loading = false;
        // Remove contact from the list
        state.contacts = state.contacts.filter(c => c.id !== action.payload.id);
        state.total = Math.max(0, state.total - 1);
        // Clear selected contact if it was deleted
        if (state.selectedContact?.id === action.payload.id) {
          state.selectedContact = null;
        }
        state.syncTimestamp = Date.now();
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete contact';
      })
      
      // Handle syncContactsFromCache
      .addCase(syncContactsFromCache.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncContactsFromCache.fulfilled, (state, action) => {
        state.loading = false;
        state.syncTimestamp = action.payload.timestamp;
      })
      .addCase(syncContactsFromCache.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to sync contacts';
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