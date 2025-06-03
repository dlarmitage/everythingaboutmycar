import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Test from './Test';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DocumentUpload = lazy(() => import('./pages/DocumentUpload'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VehicleList = lazy(() => import('./pages/VehicleList'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const VehicleForm = lazy(() => import('./pages/VehicleForm'));
const MaintenanceList = lazy(() => import('./pages/MaintenanceList'));
const MaintenanceForm = lazy(() => import('./pages/MaintenanceForm'));
const DocumentList = lazy(() => import('./pages/DocumentList'));
const RecallList = lazy(() => import('./pages/RecallList'));
const RecallForm = lazy(() => import('./pages/RecallForm'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Protected Routes - Require Authentication */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/test" element={<ProtectedRoute><Test /></ProtectedRoute>} />
              
              {/* Vehicle Routes */}
              <Route path="/vehicles" element={<ProtectedRoute><VehicleList /></ProtectedRoute>} />
              <Route path="/vehicles/add" element={<ProtectedRoute><VehicleForm /></ProtectedRoute>} />
              <Route path="/vehicles/:id" element={<ProtectedRoute><VehicleDetail /></ProtectedRoute>} />
              <Route path="/vehicles/:id/edit" element={<ProtectedRoute><VehicleForm /></ProtectedRoute>} />
              
              {/* Maintenance Routes */}
              <Route path="/maintenance" element={<ProtectedRoute><MaintenanceList /></ProtectedRoute>} />
              <Route path="/maintenance/add" element={<ProtectedRoute><MaintenanceForm /></ProtectedRoute>} />
              <Route path="/maintenance/:id" element={<ProtectedRoute><MaintenanceForm /></ProtectedRoute>} />
              
              {/* Document Routes */}
              <Route path="/documents" element={<ProtectedRoute><DocumentList /></ProtectedRoute>} />
              <Route path="/documents/upload" element={<ProtectedRoute><DocumentUpload /></ProtectedRoute>} />
              <Route path="/documents/:id" element={<ProtectedRoute><DocumentList /></ProtectedRoute>} />
              
              {/* Recall Routes */}
              <Route path="/recalls" element={<ProtectedRoute><RecallList /></ProtectedRoute>} />
              <Route path="/recalls/new" element={<ProtectedRoute><RecallForm /></ProtectedRoute>} />
              <Route path="/recalls/:id" element={<ProtectedRoute><RecallForm /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              
              {/* Public Routes - Redirect to Dashboard if Authenticated */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              
              {/* Fallback Routes */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
