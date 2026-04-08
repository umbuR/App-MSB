import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { formatRupiah } from '../lib/logic';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Wallet, TrendingUp, Users, AlertCircle, Receipt, Lock, Unlock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const storting = useLiveQuery(
    () => db.storting.where('date').equals(today).first()
  );

  const pengeluaranHariIni = useLiveQuery(
    () => db.pengeluaran.where('tanggal').equals(today).toArray(),
    []
  );

  const setting = useLiveQuery(() => db.settings.get('resort_config'));

  const [namaKolektor, setNamaKolektor] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (setting) {
      setNamaKolektor(setting.nama_kolektor || '');
    }
  }, [setting]);

  const totalPengeluaran = pengeluaranHariIni?.reduce((sum, item) => sum + item.nominal, 0) || 0;

  const stats = useLiveQuery(async () => {
    const txs = await db.transactions.toArray();
    const payments = await db.payments.toArray();
    
    const totalPencairan = txs.reduce((sum, t) => sum + t.acc_pinjaman, 0);
    const totalPembayaran = payments.reduce((sum, p) => sum + p.nominal, 0);
    
    return {
      totalNasabah: txs.length,
      totalPencairan,
      totalPembayaran
    };
  });

  const handleToggleResort = async (status: 'lepas' | 'pegang') => {
    setIsSaving(true);
    try {
      await db.settings.put({
        id: 'resort_config',
        status_resort: status,
        nama_kolektor: setting?.nama_kolektor || namaKolektor || ''
      });
    } catch (error) {
      console.error(error);
      setAlertMessage('Terjadi kesalahan saat mengubah status resort.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveKolektor = async () => {
    setIsSaving(true);
    try {
      await db.settings.put({
        id: 'resort_config',
        status_resort: setting?.status_resort || 'pegang',
        nama_kolektor: namaKolektor || ''
      });
      setAlertMessage('Nama Kolektor berhasil disimpan');
    } catch (error) {
      console.error(error);
      setAlertMessage('Terjadi kesalahan saat menyimpan nama kolektor.');
    } finally {
      setIsSaving(false);
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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-medium text-gray-500 mb-1">Tanggal Hari Ini</h2>
        <p className="text-lg font-bold text-gray-800">
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
        </p>
      </div>

      {user?.role === 'pimpinan' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800">Kontrol Resort</h2>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nama Kolektor</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={namaKolektor}
                onChange={(e) => setNamaKolektor(e.target.value)}
                placeholder="Masukkan nama kolektor"
                disabled={isSaving}
                className="flex-1 p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              />
              <button 
                onClick={handleSaveKolektor}
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Simpan'}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleToggleResort('lepas')}
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors disabled:opacity-70 ${
                setting?.status_resort === 'lepas' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              }`}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              Lepas Resort
            </button>
            <button
              onClick={() => handleToggleResort('pegang')}
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors disabled:opacity-70 ${
                setting?.status_resort === 'pegang' || !setting?.status_resort
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
              }`}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />}
              Pegang Resort
            </button>
          </div>
          {setting?.status_resort === 'lepas' && (
            <p className="text-xs text-red-600 text-center font-medium">
              Akses ke menu operasional sedang dikunci.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-600" size={20} />
            <h3 className="text-sm font-medium text-blue-800">Nasabah</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats?.totalNasabah || 0}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600" size={20} />
            <h3 className="text-sm font-medium text-green-800">Drop Kini</h3>
          </div>
          <p className="text-lg font-bold text-green-900">
            {formatRupiah(storting?.drop_kini || 0)}
          </p>
        </div>
      </div>

      <div className="bg-red-50 p-4 rounded-xl border border-red-100">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="text-red-600" size={20} />
          <h3 className="text-sm font-medium text-red-800">Total Pengeluaran Hari Ini</h3>
        </div>
        <p className="text-2xl font-bold text-red-900">{formatRupiah(totalPengeluaran)}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="text-gray-600" size={20} />
            <h3 className="font-bold text-gray-800">Status Storting Hari Ini</h3>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            (storting?.persentase || 0) >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {(storting?.persentase || 0).toFixed(1)}%
          </span>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Target Kini</span>
              <span className="font-bold">{formatRupiah(storting?.target_kini || 0)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Storting Kini</span>
              <span className="font-bold text-green-600">{formatRupiah(storting?.storting_kini || 0)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(storting?.persentase || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {(!storting || storting.target_kini === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex gap-3 items-start">
          <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-yellow-800 text-sm">Target Belum Diatur</h4>
            <p className="text-xs text-yellow-700 mt-1">Silakan atur target harian di menu Storting agar persentase dapat dihitung.</p>
          </div>
        </div>
      )}
    </div>
  );
}
