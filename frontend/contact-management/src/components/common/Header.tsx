import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleLogoutConfirm = () => {
    dispatch(logout());
    setShowLogoutModal(false);
  };

  return (
    <>
      {/* HEADER */}
      <header className="bg-white shadow relative z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">

            <Link
              to={isAdmin ? '/admin/contacts' : '/dashboard'}
              className="text-xl font-bold text-blue-600"
            >
              Contact Manager
            </Link>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaUserCircle className="w-6 h-6 text-blue-600" />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.role === 'admin'
                      ? user?.username.toUpperCase()
                      : user?.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>

              {/* LOGOUT BUTTON */}
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="inline-flex items-center text-gray-700 hover:text-red-600"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span className="hidden md:inline ml-2">Logout</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ✅ LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-3">
              Confirm Logout
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
