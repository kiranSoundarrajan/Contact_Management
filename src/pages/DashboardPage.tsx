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
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleCreateContact = async (data: ContactFormData) => {
    try {
      await dispatch(createContact(data)).unwrap();
      setIsModalOpen(false);
      toast.success('Contact created successfully');
      // Refresh contacts list
      dispatch(fetchUserContacts({ page: currentPage }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to create contact');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.username}!
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              You have {total} contact(s) in your list
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Add New Contact
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FaAddressBook className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No contacts yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Get started by creating your first contact
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </button>
              </div>
            ) : (
              <ContactList
                contacts={contacts}
                currentPage={currentPage}
                totalPages={Math.ceil(total / 15)}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </main>

      {/* Contact Modal */}
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