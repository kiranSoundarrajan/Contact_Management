import React from 'react';
import { Contact } from '../../types/contact.types';
import { formatDate, getInitials } from '../../utils/helpers';
import { FaEnvelope, FaMapMarkerAlt, FaBirthdayCake, FaEdit, FaTrash } from 'react-icons/fa';

interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  isAdmin?: boolean;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  isAdmin = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {getInitials(contact.name)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
            {isAdmin && (
              <p className="text-sm text-gray-500">User ID: {contact.userId}</p>
            )}
          </div>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(contact)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                title="Edit contact"
              >
                <FaEdit className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(contact)}
                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                title="Delete contact"
              >
                <FaTrash className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center text-gray-600">
          <FaEnvelope className="w-4 h-4 mr-3 text-gray-400" />
          <span className="text-sm truncate">{contact.email}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <FaMapMarkerAlt className="w-4 h-4 mr-3 text-gray-400" />
          <span className="text-sm">{contact.place}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <FaBirthdayCake className="w-4 h-4 mr-3 text-gray-400" />
          <span className="text-sm">{formatDate(contact.dob)}</span>
        </div>
      </div>
      
      {contact.createdAt && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Created: {formatDate(contact.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContactCard;