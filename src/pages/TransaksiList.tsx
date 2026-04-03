import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { formatRupiah, tentukanKategori } from '../lib/logic';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, ChevronRight, User } from 'lucide-react';
import { useState } from 'react';

export default function TransaksiList() {
  const [search, setSearch] = useState('');
  
  const transactions = useLiveQuery(async () => {
    const txs = await db.transactions.toArray();
    const payments = await db.payments.toArray();
    const today = format(new Date(), 'yyyy-MM-dd');
    
    return txs.map(tx => {
      const txPayments = payments.filter(p => p.transaction_id === tx.id);
      const kategori = tentukanKategori(tx, txPayments, today);
      return { ...tx, kategori };
    }).filter(tx => tx.nama_nasabah.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const getKategoriColor = (kategori: string) => {
    switch (kategori) {
      case 'PB': return 'bg-green-100 text-green-800 border-green-200';
      case 'L I': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'L II': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CCM': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CM': return 'bg-red-100 text-red-800 border-red-200';
      case 'ML': return 'bg-red-900 text-white border-red-900';
      case 'LUNAS': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Cari nama nasabah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-3">
        {transactions?.map((tx) => (
          <Link
            key={tx.id}
            to={`/transaksi/${tx.id}`}
            className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 p-2 rounded-full">
                  <User size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{tx.nama_nasabah}</h3>
                  <p className="text-xs text-gray-500">{tx.alamat}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getKategoriColor(tx.kategori)}`}>
                {tx.kategori}
              </span>
            </div>
            
            <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Pinjaman</p>
                <p className="font-bold text-gray-800">{formatRupiah(tx.acc_pinjaman)}</p>
              </div>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Detail <ChevronRight size={16} />
              </div>
            </div>
          </Link>
        ))}

        {transactions?.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <User size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Tidak ada data nasabah ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
