import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

type PublicRouteProps = {
  children: ReactNode;
};

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading } = useApp();
  const [waitTime, setWaitTime] = useState(0);

  useEffect(() => {
    // Set a maximum wait time of 5 seconds for loading
    const timer = setTimeout(() => {
      setWaitTime(prev => prev + 1);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [user, isLoading, waitTime]);

  // If still loading but not for too long, show spinner
  if (isLoading && waitTime < 5) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // If loading takes too long, proceed anyway
  if (isLoading && waitTime >= 5) {
    if (user) {
      return <Navigate to="/" replace />;
    } else {
      return <>{children}</>;
    }
  }

  if (user) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
