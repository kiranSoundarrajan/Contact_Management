import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchUserContacts,
  updateContact,
  deleteContact,
  startPageLoading,
  stopPageLoading,
  setPage,
} from "../store/slices/contactSlice";
import Header from "../components/common/Header";
import ContactTable from "../components/contacts/ContactTable";
import Modal from "../components/ui/Modal";
import ContactForm from "../components/contacts/ContactForm";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Contact, ContactFormData } from "../types/contact.types";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaStepBackward,
  FaStepForward,
  FaSync,
} from "react-icons/fa";

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
    syncTimestamp,
    currentPage,
  } = useAppSelector((state) => state.contacts);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /* ---------------- SEARCH DEBOUNCE ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);

      // ✅ whenever new search happens, go to page 1
      if (currentPage !== 1) {
        dispatch(setPage(1));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, dispatch, currentPage]);

  /* ---------------- FETCH CONTACTS (ONLY HERE) ---------------- */
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    const loadContacts = async () => {
      try {
        dispatch(startPageLoading());

        await dispatch(
          fetchUserContacts({
            page: currentPage,
            limit: 15,
            search: debouncedSearch,
          })
        ).unwrap();

        dispatch(stopPageLoading());
      } catch (error: any) {
        dispatch(stopPageLoading());
        console.error("Admin Contacts fetch failed:", error);
        toast.error(error?.message || "Failed to load contacts");
      }
    };

    loadContacts();
  }, [dispatch, navigate, user, debouncedSearch, currentPage]);

  /* ---------------- PAGE CHANGE HANDLER (NO FETCH INSIDE) ---------------- */
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (
        newPage < 1 ||
        newPage > totalPages ||
        contactsLoading ||
        pageLoading ||
        newPage === currentPage
      ) {
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });

      // ✅ Only update page. Fetch happens in useEffect.
      dispatch(setPage(newPage));
    },
    [dispatch, totalPages, contactsLoading, pageLoading, currentPage]
  );

  /* ---------------- GENERATE PAGINATION NUMBERS ---------------- */
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);

      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) pages.push(i);

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  /* ---------------- REFRESH ---------------- */
  const handleRefresh = useCallback(async () => {
    try {
      dispatch(startPageLoading());

      await dispatch(
        fetchUserContacts({
          page: currentPage,
          limit: 15,
          search: debouncedSearch,
          forceRefresh: true,
        })
      ).unwrap();

      dispatch(stopPageLoading());
      toast.success("Contacts refreshed successfully!");
    } catch (err: any) {
      dispatch(stopPageLoading());
      toast.error(err?.message || "Failed to refresh contacts");
    }
  }, [dispatch, currentPage, debouncedSearch]);

  /* ---------------- EDIT / DELETE ---------------- */
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
      toast.success("Contact updated");
      setIsEditModalOpen(false);
      setSelectedContact(null);

      // ✅ refresh current page
      dispatch(setPage(currentPage));
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedContact) return;

    try {
      await dispatch(deleteContact(selectedContact.id)).unwrap();
      toast.success("Contact deleted");
      setIsDeleteModalOpen(false);
      setSelectedContact(null);

      // ✅ if last contact deleted from last page → go previous page
      if (contacts.length === 1 && currentPage > 1) {
        dispatch(setPage(currentPage - 1));
      } else {
        dispatch(setPage(currentPage));
      }
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center my-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>

              <button
                onClick={handleRefresh}
                className="text-gray-500 hover:text-blue-600 transition-colors p-2"
                title="Refresh contacts"
                disabled={contactsLoading || pageLoading}
              >
                <FaSync
                  className={`w-4 h-4 ${
                    contactsLoading || pageLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            <p className="text-sm text-gray-600 mt-1">
              Total Contacts:{" "}
              <span className="font-semibold text-gray-800">{total}</span>
              <span className="mx-2">•</span>
              Page:{" "}
              <span className="font-semibold text-gray-800">
                {currentPage} of {totalPages}
              </span>
              <span className="mx-2">•</span>
              Showing{" "}
              <span className="font-semibold text-gray-800">{contacts.length}</span>{" "}
              contacts
              {syncTimestamp && (
                <span className="ml-2 text-xs text-gray-500">
                  (Updated: {new Date(syncTimestamp).toLocaleTimeString()})
                </span>
              )}
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

        {/* MAIN CARD */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col flex-1 overflow-hidden relative min-h-[400px] border border-gray-200">
          {/* LOADING OVERLAY */}
          {(contactsLoading || pageLoading) && (
            <div className="absolute inset-0 bg-white/80 z-30 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="relative mx-auto">
                  <div className="w-10 h-10 border-3 border-blue-100 rounded-full"></div>
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {pageLoading ? `Loading page ${currentPage}` : "Loading contacts..."}
                </p>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div
            className={`overflow-x-auto flex-1 transition-opacity duration-200 ${
              contactsLoading || pageLoading ? "opacity-50" : "opacity-100"
            }`}
          >
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
                <p className="text-xl font-semibold text-gray-700">
                  No contacts found
                </p>
                <p className="text-sm text-gray-400 max-w-md px-4">
                  {debouncedSearch
                    ? `No results found for "${debouncedSearch}". Try a different search term.`
                    : "No contacts available."}
                </p>
              </div>
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="hidden sm:inline">Page</span>
                  <span className="font-semibold text-gray-800">{currentPage}</span>
                  <span>of</span>
                  <span className="font-semibold text-gray-800">{totalPages}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                  <button
                    disabled={currentPage === 1 || contactsLoading || pageLoading}
                    onClick={() => handlePageChange(1)}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 transition-all duration-200 flex items-center gap-1"
                  >
                    <FaStepBackward className="w-3 h-3" />
                    <span className="hidden sm:inline">First</span>
                  </button>

                  <button
                    disabled={currentPage === 1 || contactsLoading || pageLoading}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 transition-all duration-200 flex items-center gap-1"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {generatePageNumbers().map((pageNum, index) =>
                      pageNum === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(Number(pageNum))}
                          disabled={contactsLoading || pageLoading}
                          className={`relative px-3 py-2 min-w-[40px] border rounded-lg text-sm font-medium transition-all duration-150 ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    disabled={currentPage === totalPages || contactsLoading || pageLoading}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 transition-all duration-200 flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FaChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    disabled={currentPage === totalPages || contactsLoading || pageLoading}
                    onClick={() => handlePageChange(totalPages)}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 transition-all duration-200 flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Last</span>
                    <FaStepForward className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Go to:</span>
                  <select
                    value={currentPage}
                    onChange={(e) => handlePageChange(Number(e.target.value))}
                    disabled={contactsLoading || pageLoading}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <option key={p} value={p}>
                          Page {p}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
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
                  This action <span className="font-bold">cannot be undone</span>.
                  The contact{" "}
                  <span className="font-bold">"{selectedContact?.name}"</span>{" "}
                  will be permanently removed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={contactsLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={contactsLoading}
              isLoading={contactsLoading}
            >
              Delete Contact
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminContactsPage;
