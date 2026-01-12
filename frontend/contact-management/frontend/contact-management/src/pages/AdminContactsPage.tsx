import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import {
  fetchAllContacts,
  updateContact,
  deleteContact,
  startPageLoading,
  stopPageLoading,
} from '../store/slices/contactSlice';
import Header from '../components/common/Header';
import ContactTable from '../components/contacts/ContactTable';
import Modal from '../components/ui/Modal';
import ContactForm from '../components/contacts/ContactForm';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Contact, ContactFormData } from '../types/contact.types';
import { FaSearch, FaChevronLeft, FaChevronRight, FaStepBackward, FaStepForward } from 'react-icons/fa';

const AdminContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { 
    contacts, 
    loading: contactsLoading, 
    pageLoading,
    total, 
    totalPages,
    
  } = useAppSelector((state) => state.contacts);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /* ---------------- SEARCH DEBOUNCE ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ---------------- FETCH CONTACTS ---------------- */
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const loadContacts = async () => {
      try {
        await dispatch(fetchAllContacts({ page, search: debouncedSearch }));
      } catch (error) {
        toast.error('Failed to load contacts');
      }
    };
    
    loadContacts();
  }, [dispatch, navigate, user, debouncedSearch, page]);

  /* ---------------- SMOOTH PAGE CHANGE HANDLER ---------------- */
  const handlePageChange = useCallback(async (newPage: number) => {
    if (
      newPage < 1 ||
      newPage > totalPages ||
      contactsLoading ||
      pageLoading ||
      newPage === page ||
      isChangingPage
    ) {
      return;
    }

    setIsChangingPage(true);
    
    // Smooth scroll to top first
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Start page loading animation
    dispatch(startPageLoading());
    
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update page state
    setPage(newPage);
    
    // Fetch data for new page
    try {
      await dispatch(fetchAllContacts({ page: newPage, search: debouncedSearch }));
    } catch (error) {
      toast.error('Failed to load contacts');
      dispatch(stopPageLoading());
    } finally {
      // Reset changing state after animation
      setTimeout(() => {
        setIsChangingPage(false);
      }, 300);
    }
  }, [dispatch, debouncedSearch, page, totalPages, contactsLoading, pageLoading, isChangingPage]);

  /* ---------------- GENERATE PAGINATION NUMBERS ---------------- */
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total pages are less than maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end pages
      let startPage = Math.max(1, page - 2);
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
      
      // Adjust if we're at the end
      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
      
      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add last page and ellipsis if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  /* ---------------- HANDLERS ---------------- */
  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
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
      await dispatch(
        updateContact({ id: selectedContact.id, data })
      ).unwrap();

      toast.success('Contact updated');
      setIsEditModalOpen(false);
      setSelectedContact(null);

      await dispatch(fetchAllContacts({ page, search: debouncedSearch }));
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedContact) return;

    try {
      await dispatch(deleteContact(selectedContact.id)).unwrap();
      toast.success('Contact deleted');

      setIsDeleteModalOpen(false);
      setSelectedContact(null);

      await dispatch(fetchAllContacts({ page, search: debouncedSearch }));
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center my-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Total Contacts: <span className="font-semibold text-gray-800">{total}</span>
              <span className="mx-2">•</span>
              Showing <span className="font-semibold text-gray-800">{contacts.length}</span> contacts
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts by name, email..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col flex-1 overflow-hidden relative min-h-[400px] border border-gray-200">
          
          {/* CENTERED MINIMAL LOADING OVERLAY */}
          {(contactsLoading || pageLoading) && (
            <div className="absolute inset-0 bg-white/80 z-30 flex items-center justify-center transition-all duration-200 ease-out">
              <div className="text-center space-y-4">
                {/* SMALL SPINNER */}
                <div className="relative mx-auto">
                  <div className="w-10 h-10 border-3 border-blue-100 rounded-full"></div>
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                
                {/* MINIMAL TEXT */}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {pageLoading ? `Loading page ${page}` : 'Loading contacts...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TABLE CONTAINER WITH SUBTLE TRANSITIONS */}
          <div className={`overflow-x-auto flex-1 transition-opacity duration-200 ease-in-out ${
            (contactsLoading || pageLoading) 
              ? 'opacity-50' 
              : 'opacity-100'
          }`}>
            <ContactTable
              contacts={contacts}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* EMPTY STATE */}
          {!contactsLoading && !pageLoading && contacts.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 space-y-5">
              <div className="text-6xl opacity-30">📭</div>
              <div className="text-center space-y-2">
                <p className="text-xl font-semibold text-gray-700">No contacts found</p>
                <p className="text-sm text-gray-400 max-w-md px-4">
                  {debouncedSearch 
                    ? `No results found for "${debouncedSearch}". Try a different search term.` 
                    : 'Start by adding your first contact to see them here.'}
                </p>
              </div>
              {!debouncedSearch && (
                <Button 
                  variant="primary" 
                  className="mt-4"
                  onClick={() => navigate('/contacts/new')}
                >
                  Add First Contact
                </Button>
              )}
            </div>
          )}

          {/* ENHANCED SMOOTH PAGINATION */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* PAGE INFO */}
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="hidden sm:inline">Page</span>
                  <span className="font-semibold text-gray-800">{page}</span>
                  <span>of</span>
                  <span className="font-semibold text-gray-800">{totalPages}</span>
                  <span className="mx-2">•</span>
                  <span className="text-gray-500">
                    <span className="font-medium text-gray-800">{contacts.length}</span> of{' '}
                    <span className="font-medium text-gray-800">{total}</span> contacts
                  </span>
                </div>

                {/* PAGINATION CONTROLS */}
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                  {/* FIRST PAGE */}
                  <button
                    disabled={page === 1 || contactsLoading || pageLoading || isChangingPage}
                    onClick={() => handlePageChange(1)}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 hover:shadow-sm transition-all duration-200 flex items-center gap-1"
                  >
                    <FaStepBackward className="w-3 h-3" />
                    <span className="hidden sm:inline">First</span>
                  </button>

                  {/* PREVIOUS PAGE */}
                  <button
                    disabled={page === 1 || contactsLoading || pageLoading || isChangingPage}
                    onClick={() => handlePageChange(page - 1)}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 hover:shadow-sm transition-all duration-200 flex items-center gap-1"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {/* PAGE NUMBERS */}
                  <div className="flex items-center gap-1">
                    {generatePageNumbers().map((pageNum, index) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(Number(pageNum))}
                          disabled={contactsLoading || pageLoading || isChangingPage}
                          className={`relative px-3 py-2 min-w-[40px] border rounded-lg text-sm font-medium transition-all duration-150 ${
                            page === pageNum
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 hover:shadow-sm'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {page === pageNum && (pageLoading || isChangingPage) ? (
                            <>
                              <span className="invisible">{pageNum}</span>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            </>
                          ) : (
                            pageNum
                          )}
                        </button>
                      )
                    ))}
                  </div>

                  {/* NEXT PAGE */}
                  <button
                    disabled={page === totalPages || contactsLoading || pageLoading || isChangingPage}
                    onClick={() => handlePageChange(page + 1)}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 hover:shadow-sm transition-all duration-200 flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FaChevronRight className="w-3 h-3" />
                  </button>

                  {/* LAST PAGE */}
                  <button
                    disabled={page === totalPages || contactsLoading || pageLoading || isChangingPage}
                    onClick={() => handlePageChange(totalPages)}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 hover:shadow-sm transition-all duration-200 flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Last</span>
                    <FaStepForward className="w-3 h-3" />
                  </button>
                </div>

                {/* PAGE JUMPER */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Go to:</span>
                  <div className="relative">
                    <select
                      value={page}
                      onChange={(e) => handlePageChange(Number(e.target.value))}
                      disabled={contactsLoading || pageLoading || isChangingPage}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 pr-8 appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                    >
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <option key={p} value={p}>
                          Page {p}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <FaChevronRight className="w-3 h-3 rotate-90 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* MINIMAL PROGRESS INDICATOR */}
              {(pageLoading || isChangingPage) && (
                <div className="mt-3 flex justify-center">
                  <div className="w-48 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        animation: 'progress 1.2s ease-in-out infinite',
                        width: '40%',
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Contact"
      >
        {selectedContact && (
          <ContactForm
            initialData={selectedContact}
            onSubmit={handleUpdateContact}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={contactsLoading}
          />
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-red-500 text-xl mt-0.5">⚠️</div>
              <div>
                <p className="text-red-700 font-semibold">
                  Are you sure you want to delete this contact?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This action <span className="font-bold">cannot be undone</span>. The contact{' '}
                  <span className="font-bold">"{selectedContact?.name}"</span> will be permanently
                  removed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={contactsLoading}
              className="px-4 py-2 text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={contactsLoading}
              isLoading={contactsLoading}
              className="px-4 py-2 text-sm"
            >
              Delete Contact
            </Button>
          </div>
        </div>
      </Modal>

      {/* GLOBAL ANIMATION STYLES */}
      <style>
        {`
          @keyframes progress {
            0% { 
              transform: translateX(-100%); 
            }
            50% { 
              transform: translateX(100%); 
            }
            100% { 
              transform: translateX(200%); 
            }
          }
          
          .border-3 {
            border-width: 3px;
          }
          
          /* Smooth transitions for all interactive elements */
          button, select, input {
            transition: all 0.15s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default AdminContactsPage;