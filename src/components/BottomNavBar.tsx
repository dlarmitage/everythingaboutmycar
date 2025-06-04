import { useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, WrenchScrewdriverIcon, ClipboardDocumentListIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const tabs = [
  { name: 'Vehicles', path: '/vehicles', icon: HomeIcon },
  { name: 'Service Records', path: '/service-records', icon: ClipboardDocumentListIcon },
  { name: 'Maintenance', path: '/maintenance', icon: WrenchScrewdriverIcon },
  { name: 'Recalls', path: '/recalls', icon: ExclamationTriangleIcon },
];

export default function BottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-between">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.name}
              className={`flex flex-col items-center flex-1 py-2 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
              onClick={() => navigate(tab.path)}
            >
              <tab.icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
