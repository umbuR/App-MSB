import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { formatRupiah, tentukanKategori } from '../lib/logic';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, ChevronRight, User, Trash2, CheckCircle, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function TransaksiList() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'semua' | 'pending'>('semua');
  const { user } = useAuth();
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [parafInput, setParafInput] = useState('');

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

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTxId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedTxId) {
      await db.transactions.delete(selectedTxId);
      const payments = await db.payments.where('transaction_id').equals(selectedTxId).toArray();
      const paymentIds = payments.map(p => p.id!);
      await db.payments.bulkDelete(paymentIds);
      setShowDeleteModal(false);
      setSelectedTxId(null);
    }
  };

  const handleApproveClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTxId(id);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (selectedTxId && parafInput.trim()) {
      await db.transactions.update(selectedTxId, {
        status_acc: 'approved',
        paraf_pimpinan: parafInput,
        sync_status: 'pending',
        notif_kolektor_seen: false
      });
      setShowApproveModal(false);
      setSelectedTxId(null);
      setParafInput('');
    }
  };

  const handleRejectClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTxId(id);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (selectedTxId) {
      await db.transactions.update(selectedTxId, {
        status_acc: 'rejected',
        sync_status: 'pending',
        notif_kolektor_seen: false
      });
      setShowRejectModal(false);
      setSelectedTxId(null);
    }
  };

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

  const pendingCount = transactions?.filter(tx => tx.status_acc === 'pending').length || 0;
  
  const displayedTransactions = transactions?.filter(tx => {
    if (activeTab === 'pending') return tx.status_acc === 'pending';
    return true; // 'semua' shows all
  });

  return (
    <div className="space-y-4 relative">
      {/* Modals */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg text-gray-800">ACC Pinjaman</h3>
            <p className="text-sm text-gray-600">Masukkan Paraf ACC Pimpinan untuk menyetujui pinjaman ini.</p>
            <input 
              type="text" 
              value={parafInput}
              onChange={(e) => setParafInput(e.target.value)}
              placeholder="Ketik paraf..."
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <div className="flex gap-3 pt-2">
              <button onClick={() => {setShowApproveModal(false); setSelectedTxId(null); setParafInput('');}} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">Batal</button>
              <button onClick={confirmApprove} disabled={!parafInput.trim()} className="flex-1 py-2 rounded-lg bg-green-600 text-white font-medium disabled:opacity-50">Setujui</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg text-red-600">Tolak Pinjaman</h3>
            <p className="text-sm text-gray-600">Apakah Anda yakin ingin menolak pengajuan pinjaman ini?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => {setShowRejectModal(false); setSelectedTxId(null);}} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">Batal</button>
              <button onClick={confirmReject} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium">Ya, Tolak</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg text-red-600">Hapus Nasabah</h3>
            <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus nasabah ini beserta seluruh riwayat pembayarannya?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => {setShowDeleteModal(false); setSelectedTxId(null);}} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">Batal</button>
              <button onClick={confirmDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

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

      {user?.role === 'pimpinan' && (
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setActiveTab('semua')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'semua' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Semua Nasabah
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors relative ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Menunggu ACC
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {displayedTransactions?.map((tx) => (
          <Link
            key={tx.id}
            to={`/transaksi/${tx.id}`}
            className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors relative"
          >
            {tx.status_acc === 'pending' && (
              <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 rounded-bl-xl rounded-tr-xl text-[10px] font-bold uppercase tracking-wider">
                Menunggu ACC
              </div>
            )}
            {tx.status_acc === 'rejected' && (
              <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 rounded-bl-xl rounded-tr-xl text-[10px] font-bold uppercase tracking-wider">
                Ditolak
              </div>
            )}

            <div className="flex justify-between items-start mb-2 mt-2">
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
              
              <div className="flex items-center gap-2">
                {user?.role === 'pimpinan' && tx.status_acc === 'pending' && (
                  <div className="flex gap-1 mr-2">
                    <button 
                      onClick={(e) => handleApproveClick(e, tx.id!)}
                      className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title="ACC Pinjaman"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleRejectClick(e, tx.id!)}
                      className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Tolak Pinjaman"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                )}
                
                {user?.role === 'pimpinan' && (
                  <button 
                    onClick={(e) => handleDeleteClick(e, tx.id!)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors mr-2"
                    title="Hapus Nasabah"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  Detail <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        ))}

        {displayedTransactions?.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <User size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Tidak ada data nasabah ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
