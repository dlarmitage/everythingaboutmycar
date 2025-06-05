import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MobileLayout from './layouts/MobileLayout';
import Vehicles from './pages/Vehicles';
import ServiceRecords from './pages/ServiceRecords';
import Maintenance from './pages/Maintenance';
import Recalls from './pages/Recalls';
import Landing from './pages/Landing';
import { VehicleProvider } from './context/VehicleContext';
import { useApp } from './context/useApp';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useApp();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  return user ? <>{children}</> : <LoadingFallback />;
};

function AppRoutes() {
  const { user, isLoading } = useApp();
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  return (
    <Routes>
      {/* Landing page for non-authenticated users */}
      <Route path="/" element={
        user ? <Navigate to="/vehicles" replace /> : <Landing />
      } />
      
      {/* Auth routes */}
      <Route path="/login" element={
        <Suspense fallback={<LoadingFallback />}>
          {user ? <Navigate to="/vehicles" replace /> : <Login />}
        </Suspense>
      } />
      <Route path="/register" element={
        <Suspense fallback={<LoadingFallback />}>
          {user ? <Navigate to="/vehicles" replace /> : <Register />}
        </Suspense>
      } />
      
      {/* Protected routes */}
      <Route element={<MobileLayout />}>
        <Route path="/vehicles" element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        } />
        <Route path="/service-records" element={
          <ProtectedRoute>
            <ServiceRecords />
          </ProtectedRoute>
        } />
        <Route path="/maintenance" element={
          <ProtectedRoute>
            <Maintenance />
          </ProtectedRoute>
        } />
        <Route path="/recalls" element={
          <ProtectedRoute>
            <Recalls />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <VehicleProvider>
      <Router>
        <AppRoutes />
      </Router>
    </VehicleProvider>
  );
}

export default App;
