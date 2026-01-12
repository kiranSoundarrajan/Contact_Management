import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { fetchUserContacts, createContact } from '../store/slices/contactSlice';
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
  const { contacts, loading, total } = useAppSelector((state) => state.contacts);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    dispatch(fetchUserContacts({ page: currentPage }));
  }, [dispatch, navigate, user, currentPage]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleCreateContact = async (data: ContactFormData) => {
    try {
      await dispatch(createContact(data)).unwrap();
      setIsModalOpen(false);
      toast.success('Contact created successfully');
      dispatch(fetchUserContacts({ page: currentPage }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to create contact');
    }
  };

  return (
    /* 🔥 NO PAGE SCROLL */
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <Header user={user} onLogout={handleLogout} />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        
        {/* TOP SECTION */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.username}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              You have {total} contact(s) in your list
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FaPlus className="w-4 h-4 mr-2" />
            Add New Contact
          </button>
        </div>

        {/* CARD */}
        <div className="bg-white shadow rounded-lg flex-1 overflow-hidden flex flex-col">
          <div className="p-6 flex-1 overflow-hidden flex flex-col">

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <FaAddressBook className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">
                  No contacts yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Get started by creating your first contact
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </button>
              </div>
            ) : (
              /* 🔥 ONLY LIST AREA HANDLES INTERNAL SCROLL */
              <div className="flex-1 overflow-y-auto p-1">
                <ContactList
                  contacts={contacts}
                  currentPage={currentPage}
                  totalPages={Math.ceil(total / 15)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

          </div>
        </div>
      </main>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Contact"
      >
        <ContactForm
          onSubmit={handleCreateContact}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default DashboardPage;
