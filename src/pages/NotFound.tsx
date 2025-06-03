import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          404
        </h1>
        <p className="mt-2 text-base font-semibold text-primary-600">Page not found</p>
        <p className="mt-4 text-base text-gray-500">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-10 flex justify-center gap-x-6">
          <Link
            to="/"
            className="btn-primary"
          >
            Go back home
          </Link>
          <Link
            to="/vehicles"
            className="btn-secondary"
          >
            View your vehicles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
