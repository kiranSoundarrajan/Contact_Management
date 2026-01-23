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
   🔹 FETCH USER CONTACTS - UPDATED
===================================================== */
export const fetchUserContacts = createAsyncThunk<
  ContactsResponse & { 
    forceRefresh?: boolean;
    currentPage?: number;
    search?: string; // Add search to return type
  },
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
        search = '',
        forceRefresh = false,
      } = params;

      console.log(`📡 Fetching user contacts - Page: ${page}, Search: "${search}"`);

      const state = getState();
      const userRole = state.auth.user?.role;
      
      let response: ContactsResponse;
      
      if (userRole === 'admin') {
        response = await contactApi.getAllContacts(page, limit, search);
      } else {
        response = await contactApi.getUserContacts(page, limit, search);
      }
      
      console.log(`✅ Fetched ${response.contacts.length} contacts`);
      
      return {
        ...response,
        currentPage: page,
        search,        // Include search in return
        forceRefresh,  // Include forceRefresh in return
      };
    } catch (error: any) {
      console.error('❌ Fetch user contacts error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch contacts'
      );
    }
  }
);

/* =====================================================
   🔹 CREATE CONTACT
===================================================== */
export const createContact = createAsyncThunk<
  { success: boolean; contact: Contact },
  ContactFormData,
  { state: RootState }
>(
  'contacts/createContact',
  async (data, { rejectWithValue, dispatch, getState }) => {
    try {
      console.log('📝 Creating contact with data:', data);
      
      const response = await contactApi.createContact(data);
      
      console.log('✅ Contact created:', response.contact.id);
      
      // Immediately add to state
      dispatch(addContactToState(response.contact));
      
      // Force refresh to get updated list
      setTimeout(() => {
        const state = getState();
        dispatch(fetchUserContacts({ 
          page: state.contacts.currentPage, 
          forceRefresh: true 
        }));
      }, 100);
      
      return response;
    } catch (error: any) {
      console.error('❌ Create contact error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create contact'
      );
    }
  }
);

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
    addContactToState: (state, action: PayloadAction<Contact>) => {
      state.contacts = [action.payload, ...state.contacts];
      state.total += 1;
      state.syncTimestamp = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchUserContacts
      .addCase(fetchUserContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.contacts = action.payload.contacts;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        
        // ✅ ALWAYS update currentPage from payload
        // This keeps UI in sync with data
        if (action.payload.currentPage) {
          state.currentPage = action.payload.currentPage;
        }
        
        state.lastFetchedPage = action.payload.currentPage;
        
        // Cache first page
        if (state.currentPage === 1) {
          state.userContactsCache = action.payload.contacts;
        }
        
        state.isInitialized = true;
        state.syncTimestamp = Date.now();
        state.error = null;
      })
      .addCase(fetchUserContacts.rejected, (state, action) => {
        state.loading = false;
        state.pageLoading = false;
        state.error = action.payload as string || 'Failed to fetch contacts';
      })
      
      // Handle createContact
      .addCase(createContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContact.fulfilled, (state) => {
        state.loading = false;
        state.syncTimestamp = Date.now();
      })
      .addCase(createContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create contact';
      })
      
      // Handle updateContact
      .addCase(updateContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.loading = false;
        // Update contact in the list
        const index = state.contacts.findIndex(c => c.id === action.payload.contact.id);
        if (index !== -1) {
          state.contacts[index] = action.payload.contact;
        }
        // Update selected contact
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
        state.error = null;
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