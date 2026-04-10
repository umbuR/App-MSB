import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Trash2, ShieldAlert } from 'lucide-react';

export default function ManageUsers() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'kolektor' | 'rekap'>('kolektor');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const users = useLiveQuery(() => db.users.filter(u => u.role === 'kolektor' || u.role === 'rekap').toArray());

  if (user?.role !== 'pimpinan') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Akses Ditolak</h2>
        <p className="text-gray-500 mt-2">Hanya pimpinan yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check if email already exists
      const existing = await db.users.where('email').equals(email).first();
      if (existing) {
        setAlertMessage('Email sudah terdaftar!');
        return;
      }

      await db.users.add({
        name,
        email,
        password,
        role
      });
      
      setName('');
      setEmail('');
      setPassword('');
      setRole('kolektor');
      setAlertMessage(`Akun ${role} berhasil didaftarkan!`);
    } catch (err) {
      setAlertMessage(`Terjadi kesalahan saat mendaftarkan ${role}.`);
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedId) {
      await db.users.delete(selectedId);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 text-center">
            <h3 className="font-bold text-lg text-gray-800">Informasi</h3>
            <p className="text-sm text-gray-600">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full py-2 rounded-lg bg-blue-600 text-white font-medium">Tutup</button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg text-red-600">Hapus Akun</h3>
            <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus akun ini?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => {setShowDeleteModal(false); setSelectedId(null);}} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">Batal</button>
              <button onClick={confirmDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-blue-600" /> Pendaftaran Akun
        </h2>
        
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role / Peran</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value as 'kolektor' | 'rekap')}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="kolektor">Kolektor</option>
              <option value="rekap">Rekap</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nama Lengkap</label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Nama Pengguna"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email Login</label>
            <input 
              required 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="email@koperasi.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
            <input 
              required 
              type="text" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Minimal 6 karakter"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-700 transition-colors"
          >
            Daftarkan Akun
          </button>
        </form>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Daftar Akun</h3>
        <div className="space-y-3">
          {users?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Belum ada akun yang terdaftar.</p>
          ) : (
            users?.map(u => (
              <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{u.name} <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2 uppercase">{u.role}</span></p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <button 
                  onClick={() => handleDeleteClick(u.id!)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

