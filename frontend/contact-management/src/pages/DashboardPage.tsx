import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchUserContacts,
  createContact,
  resetContacts,
  clearError,
} from '../store/slices/contactSlice';
import Header from '../components/common/Header';
import ContactForm from '../components/contacts/ContactForm';
import ContactList from '../components/contacts/ContactList';
import Modal from '../components/ui/Modal';
import { ContactFormData } from '../types/contact.types';
import { FaPlus, FaAddressBook } from 'react-icons/fa';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { contacts, loading, total, error, syncTimestamp } = useAppSelector((state) => state.contacts);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadContacts = useCallback(async () => {
    try {
      await dispatch(fetchUserContacts({ 
        page, 
        limit: 15
      })).unwrap();
    } catch (err: any) {
      console.error('Failed to load contacts:', err.message);
      toast.error('Failed to load contacts');
    }
  }, [dispatch, page]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!hasLoadedRef.current) {
      dispatch(resetContacts());
      dispatch(clearError());
      hasLoadedRef.current = true;
    }
    
    loadContacts();
  }, [dispatch, navigate, user, page, loadContacts]);

  const handleCreateContact = async (data: ContactFormData) => {
    try {
      setIsCreating(true);
      await dispatch(createContact(data)).unwrap();

      setIsModalOpen(false);
      setIsCreating(false);

      toast.success('Contact created successfully!', {
        icon: '✅',
        duration: 3000,
      });

      // If not on page 1, suggest going to page 1
      if (page !== 1) {
        toast('New contact added. Go to page 1 to see it.', {
          icon: '📄',
          duration: 4000,
        });
        setPage(1);
      }

    } catch (error: any) {
      setIsCreating(false);
      toast.error(error.message || 'Failed to create contact');
    }
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (!isCreating) {
      setIsModalOpen(false);
    }
  }, [isCreating]);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 shrink-0 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.username}!</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              You have <span className="font-semibold">{total}</span> contact(s) in your list
              {error && <span className="ml-3 text-red-500">Error: {error}</span>}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isCreating}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'Add New Contact'}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg flex-1 overflow-hidden flex flex-col border border-gray-200">
          <div className="p-6 flex-1 overflow-hidden flex flex-col">
            {loading && contacts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading your contacts...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <FaAddressBook className="w-24 h-24 text-gray-300 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No contacts yet</h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Get started by adding your first contact. All your contacts will appear here.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  <FaPlus className="w-5 h-5 mr-2" />
                  Create Your First Contact
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{contacts.length}</span> contacts on page <span className="font-semibold">{page}</span>
                  </p>
                  {syncTimestamp && (
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(syncTimestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-1">
                  <ContactList
                    contacts={contacts}
                    currentPage={page}
                    totalPages={Math.ceil(total / 15)}
                    total={total}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Contact"
      >
        <ContactForm
          onSubmit={handleCreateContact}
          onCancel={handleCloseModal}
          isLoading={isCreating}
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;