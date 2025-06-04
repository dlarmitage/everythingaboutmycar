import { Outlet } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';

export default function MobileLayout() {
  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNavBar />
    </div>
  );
}
