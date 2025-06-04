import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MobileLayout from './layouts/MobileLayout';
import Vehicles from './pages/Vehicles';
import ServiceRecords from './pages/ServiceRecords';
import Maintenance from './pages/Maintenance';
import Recalls from './pages/Recalls';
import { VehicleProvider } from './context/VehicleContext';

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
    <VehicleProvider>
      <Router>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/service-records" element={<ServiceRecords />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/recalls" element={<Recalls />} />
            <Route path="*" element={<Navigate to="/vehicles" replace />} />
          </Route>
        </Routes>
      </Router>
    </VehicleProvider>
  );
}

export default App;
