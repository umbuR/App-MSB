import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Trash2, ShieldAlert } from 'lucide-react';

export default function ManageUsers() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const kolektors = useLiveQuery(() => db.users.filter(u => u.role === 'kolektor').toArray());

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
        alert('Email sudah terdaftar!');
        return;
      }

      await db.users.add({
        name,
        email,
        password,
        role: 'kolektor'
      });
      
      setName('');
      setEmail('');
      setPassword('');
      alert('Akun Kolektor berhasil didaftarkan!');
    } catch (err) {
      alert('Terjadi kesalahan saat mendaftarkan kolektor.');
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus akun kolektor ini?')) {
      await db.users.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-blue-600" /> Pendaftaran Kolektor
        </h2>
        
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nama Lengkap</label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Nama Kolektor"
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
              placeholder="kolektor@koperasi.com"
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
            Daftarkan Kolektor
          </button>
        </form>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Daftar Akun Kolektor</h3>
        <div className="space-y-3">
          {kolektors?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Belum ada kolektor yang terdaftar.</p>
          ) : (
            kolektors?.map(kolektor => (
              <div key={kolektor.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{kolektor.name}</p>
                  <p className="text-xs text-gray-500">{kolektor.email}</p>
                </div>
                <button 
                  onClick={() => handleDelete(kolektor.id)}
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

