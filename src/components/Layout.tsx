import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, PlusCircle, CreditCard, LogOut, UserPlus, Receipt, Banknote, FileText, Building2, FileSpreadsheet, FileBarChart, FilePieChart, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useEffect, useState } from 'react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const setting = useLiveQuery(() => db.settings.get('resort_config'));
  const isLepas = setting?.status_resort === 'lepas';

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [currentNotif, setCurrentNotif] = useState<{id: string, status: string, nama: string} | null>(null);

  const unreadNotifs = useLiveQuery(async () => {
    if (user?.role === 'pimpinan') return [];
    const txs = await db.transactions
      .filter(tx => tx.notif_kolektor_seen === false && (tx.status_acc === 'approved' || tx.status_acc === 'rejected'))
      .toArray();
    return txs;
  }, [user?.role]);

  useEffect(() => {
    if (unreadNotifs && unreadNotifs.length > 0 && !showNotifModal) {
      const notif = unreadNotifs[0];
      setCurrentNotif({ id: notif.id!, status: notif.status_acc!, nama: notif.nama_nasabah });
      setShowNotifModal(true);
    }
  }, [unreadNotifs, showNotifModal]);

  const handleCloseNotif = async () => {
    if (currentNotif) {
      await db.transactions.update(currentNotif.id, {
        notif_kolektor_seen: true,
        sync_status: 'pending'
      });
      setShowNotifModal(false);
      setCurrentNotif(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Base nav items
  let navItems: { path: string; icon: any; label: string; badge?: number }[] = [
    { path: '/', icon: Home, label: 'Beranda' },
  ];

  const pendingCount = useLiveQuery(async () => {
    if (user?.role !== 'pimpinan') return 0;
    const txs = await db.transactions.where('status_acc').equals('pending').toArray();
    return txs.length;
  }, [user?.role]) || 0;

  if (user?.role === 'rekap') {
    navItems.push(
      { path: '/laporan-pinjaman', icon: FileText, label: 'Pinjaman' },
      { path: '/laporan-rekapan', icon: FileSpreadsheet, label: 'Laporan' },
      { path: '/rekapan-kecil', icon: FileBarChart, label: 'R. Kecil' },
      { path: '/rekapan-besar', icon: FilePieChart, label: 'R. Besar' }
    );
  } else {
    if (!isLepas) {
      navItems.push(
        { path: '/transaksi', icon: NasabahIcon, label: 'Nasabah', badge: pendingCount },
        { path: '/pencairan', icon: PlusCircle, label: 'Pencairan' },
        { path: '/storting', icon: CreditCard, label: 'Storting' },
        { path: '/pengeluaran', icon: Receipt, label: 'Pengeluaran' },
        { path: '/tunai', icon: Banknote, label: 'Tunai' }
      );
    }
    navItems.push({ path: '/rekapitulasi', icon: FileText, label: 'Rekap' });

    // Add Pegawai menu only for Pimpinan
    if (user?.role === 'pimpinan') {
      navItems.push({ path: '/unit', icon: Building2, label: 'Unit' });
      navItems.push({ path: '/pegawai', icon: UserPlus, label: 'Pegawai' });
    }
  }

  // Redirect if trying to access locked pages
  useEffect(() => {
    if (isLepas && user?.role !== 'rekap') {
      const lockedPaths = ['/transaksi', '/pencairan', '/storting', '/pengeluaran', '/tunai'];
      if (lockedPaths.some(p => location.pathname.startsWith(p))) {
        navigate('/');
      }
    }
  }, [isLepas, location.pathname, navigate, user?.role]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-xl relative overflow-hidden">
      {/* Notification Modal */}
      {showNotifModal && currentNotif && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${currentNotif.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <Bell size={24} />
            </div>
            <h3 className={`font-bold text-lg ${currentNotif.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
              {currentNotif.status === 'approved' ? 'Pinjaman Di-ACC' : 'Pinjaman Ditolak'}
            </h3>
            <p className="text-sm text-gray-600 font-medium">Nasabah: {currentNotif.nama}</p>
            <p className="text-sm text-gray-800 font-bold p-3 bg-gray-50 rounded-lg border border-gray-100">
              {currentNotif.status === 'approved' 
                ? '"Selamat ya pak/bu, pinjaman anda di ACC"' 
                : '"Maaf ya pak/bu, pinjamannya belum di ACC"'}
            </p>
            <button 
              onClick={() => {
                handleCloseNotif();
                if (currentNotif?.status === 'approved') {
                  navigate(`/transaksi/${currentNotif.id}`);
                }
              }} 
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${currentNotif.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {currentNotif.status === 'approved' ? 'Lanjut Foto Selfie' : 'Tutup'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center z-10">
        <div>
          <h1 className="text-lg font-bold truncate max-w-[200px]">MITRA SEJAHTERA BERSAMA</h1>
          <p className="text-xs text-blue-200 capitalize">
            Mode: {user?.role || 'Kolektor'} 
            {setting?.nama_kolektor ? ` - ${setting.nama_kolektor}` : ''}
          </p>
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
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex overflow-x-auto p-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 hide-scrollbar">
        <div className="flex justify-between w-full min-w-[400px] px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-[60px] relative ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                }`}
              >
                {item.badge ? (
                  <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-20">
                    {item.badge}
                  </span>
                ) : null}
                <Icon size={24} className={isActive ? 'fill-blue-100' : ''} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NasabahIcon(props: any) {
  return <Users {...props} />;
}



