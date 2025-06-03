import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-lg font-semibold text-primary-600">
              Everything About My Car
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              Keep track of all your vehicle information in one place
            </p>
          </div>
          <div className="flex space-x-6">
            <Link to="/about" className="text-sm text-gray-500 hover:text-gray-900">
              About
            </Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-900">
              Terms
            </Link>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 text-center">
            &copy; {currentYear} Everything About My Car. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
