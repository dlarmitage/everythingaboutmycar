import { Outlet } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import Header from '../components/Header';

export default function MobileLayout() {
  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNavBar />
    </div>
  );
}
