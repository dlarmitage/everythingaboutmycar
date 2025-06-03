import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useApp();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Vehicles', href: '/vehicles' },
    { name: 'Maintenance', href: '/maintenance' },
    { name: 'Documents', href: '/documents' },
    { name: 'Recalls', href: '/recalls' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between border-b border-gray-200 py-6 lg:border-none">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-600">
                MyCar
              </span>
            </Link>
            <div className="ml-10 hidden space-x-8 lg:block">
              {navigation.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-sm font-medium ${
                    isActive(link.href)
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link
                to="/profile"
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.first_name || 'User'}
                    className="h-8 w-8 rounded-full mr-2"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                    <span className="text-primary-800 font-medium">
                      {user.first_name?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span>Profile</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="lg:hidden">
          {mobileMenuOpen && (
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    isActive(link.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
