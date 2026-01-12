import React from 'react';
import { Contact } from '../../types/contact.types';
import ContactCard from './ContactCard';
import Button from '../ui/Button';

interface ContactListProps {
  contacts: Contact[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  isAdmin?: boolean;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  isAdmin = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Grid of contacts */}
      {contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No contacts found
          </h3>
          <p className="text-gray-500">
            {isAdmin
              ? 'No contacts in the system yet.'
              : 'Start by adding your first contact.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {(currentPage - 1) * 15 + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(currentPage * 15, contacts.length)}
            </span>{' '}
            of <span className="font-medium">{contacts.length}</span> results
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show only first, last, and pages around current
                return (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                );
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-3 py-2">...</span>
                  )}
                  <Button
                    onClick={() => onPageChange(page)}
                    variant={page === currentPage ? 'primary' : 'outline'}
                    size="sm"
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))}
            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;