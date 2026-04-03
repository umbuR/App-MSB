import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import logoImg from '../public/Logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const user = await db.users.where('email').equals(email).first();
      
      if (user && user.password === password) {
        login(user);
        navigate('/');
      } else {
        setError('Email atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Logo Section */}
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full bg-blue-700 opacity-20 transform -skew-y-6 origin-top-left"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mb-4 shadow-lg p-2">
              <img src={logoImg} alt="Logo Mitra Sejahtera Bersama" className="w-full h-full object-contain" onError={(e) => {
                // Fallback jika gambar belum diupload
                (e.target as HTMLImageElement).src = 'https://placehold.co/150x150/e2e8f0/1e3a8a?text=Logo';
              }} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">MITRA SEJAHTERA BERSAMA</h1>
            <p className="text-blue-100 text-sm mt-2 font-medium">Pinjaman Harian</p>
          </div>
        </div>


        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Silakan Login</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="email@koperasi.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors mt-4 shadow-md hover:shadow-lg"
            >
              Masuk
            </button>
          </form>

          {/* Error Message Below Form */}
          {error && (
            <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="mt-8 bg-blue-50 p-5 rounded-xl border border-blue-100 text-sm">
            <p className="font-bold text-blue-800 mb-3 text-center">Informasi Akun Demo</p>
            <div className="space-y-2.5 text-blue-900">
              <div className="flex justify-between items-center border-b border-blue-200/50 pb-2">
                <span className="font-medium">Pimpinan:</span>
                <span className="font-mono bg-white px-2 py-1 rounded shadow-sm text-xs">pimpinan@koperasi.com</span>
              </div>
              <div className="flex justify-between items-center border-b border-blue-200/50 pb-2">
                <span className="font-medium">Kolektor:</span>
                <span className="font-mono bg-white px-2 py-1 rounded shadow-sm text-xs">kolektor@koperasi.com</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Password:</span>
                <span className="font-mono bg-white px-2 py-1 rounded shadow-sm text-xs">password123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

