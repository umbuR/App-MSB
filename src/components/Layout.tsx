import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, PlusCircle, CreditCard, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Base nav items
  let navItems = [
    { path: '/', icon: Home, label: 'Beranda' },
    { path: '/transaksi', icon: Users, label: 'Nasabah' },
    { path: '/pencairan', icon: PlusCircle, label: 'Pencairan' },
    { path: '/storting', icon: CreditCard, label: 'Storting' },
  ];

  // Add Pegawai menu only for Pimpinan
  if (user?.role === 'pimpinan') {
    navItems.push({ path: '/pegawai', icon: UserPlus, label: 'Pegawai' });
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-xl relative overflow-hidden">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center z-10">
        <div>
          <h1 className="text-lg font-bold truncate max-w-[200px]">MITRA SEJAHTERA BERSAMA</h1>
          <p className="text-xs text-blue-200 capitalize">Mode: {user?.role || 'Kolektor'}</p>
        </div>
        <button onClick={handleLogout} className="p-2 bg-blue-700 rounded-full hover:bg-blue-800 transition-colors shrink-0 ml-2">
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <Icon size={24} className={isActive ? 'fill-blue-100' : ''} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}



