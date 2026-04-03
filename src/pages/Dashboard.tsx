import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { formatRupiah } from '../lib/logic';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Wallet, TrendingUp, Users, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const storting = useLiveQuery(
    () => db.storting.where('date').equals(today).first()
  );

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-medium text-gray-500 mb-1">Tanggal Hari Ini</h2>
        <p className="text-lg font-bold text-gray-800">
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
        </p>
      </div>

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
