import React from 'react';
import { Contact } from '../../types/contact.types';
import { formatDate, getInitials } from '../../utils/helpers';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface ContactTableProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}

const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex-1 overflow-hidden">
      {/* TABLE SCROLL AREA */}
      <div className="h-full overflow-y-auto overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                Place
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                DOB
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {getInitials(contact.name)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-gray-500">ID: {contact.id}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm truncate max-w-[200px]">
                  {contact.email}
                </td>

                <td className="px-6 py-4 text-sm">{contact.place}</td>

                <td className="px-6 py-4 text-sm">
                  {formatDate(contact.dob)}
                </td>

                <td className="px-6 py-4 text-sm">
                  {contact.createdAt
                    ? formatDate(contact.createdAt)
                    : 'N/A'}
                </td>

                <td className="px-6 py-4 text-sm font-medium">
                  #{contact.userId}
                </td>

                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex gap-3">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(contact)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <FaEdit className="mr-1" /> Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(contact)}
                        className="text-red-600 hover:text-red-800 flex items-center"
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactTable;
