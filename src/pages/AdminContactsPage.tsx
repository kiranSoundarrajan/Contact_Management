import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import {
  fetchAllContacts,
  updateContact,
  deleteContact,
} from '../store/slices/contactSlice';
import Header from '../components/common/Header';
import ContactTable from '../components/contacts/ContactTable';
import Modal from '../components/ui/Modal';
import ContactForm from '../components/contacts/ContactForm';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Contact, ContactFormData } from '../types/contact.types';
import { FaSearch} from 'react-icons/fa';

const AdminContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { contacts, loading, total,totalPages } = useAppSelector(
    (state) => state.contacts
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    dispatch(fetchAllContacts({ page, search: searchTerm }));
  }, [dispatch, navigate, user, page, searchTerm]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  const handleDelete = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateContact = async (data: ContactFormData) => {
    if (!selectedContact) return;

    try {
      await dispatch(updateContact({ id: selectedContact.id, data })).unwrap();
      setIsEditModalOpen(false);
      setSelectedContact(null);
      toast.success('Contact updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update contact');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedContact) return;

    try {
      await dispatch(deleteContact(selectedContact.id)).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedContact(null);
      toast.success('Contact deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contact');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Total Contacts: {total} | Page {page} of {totalPages}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No contacts found</p>
            </div>
          ) : (
            <>
              <ContactTable
                contacts={contacts}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">
                        {(page - 1) * 15 + 1}
                      </span> to{' '}
                      <span className="font-medium">
                        {Math.min(page * 15, total)}
                      </span> of{' '}
                      <span className="font-medium">{total}</span> results
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => (
                          <Button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            variant={pageNum === page ? 'primary' : 'outline'}
                            size="sm"
                          >
                            {pageNum}
                          </Button>
                        )
                      )}
                      <Button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedContact(null);
        }}
        title="Edit Contact"
      >
        {selectedContact && (
          <ContactForm
            onSubmit={handleUpdateContact}
            initialData={selectedContact}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedContact(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedContact(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete the contact "
            <span className="font-semibold">{selectedContact?.name}</span>"?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedContact(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminContactsPage;