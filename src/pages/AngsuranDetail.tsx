import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { hitungStatusAngsuran, formatRupiah, tentukanKategori } from '../lib/logic';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowLeft, MapPin, Calendar, CreditCard, Camera, Clock, XCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AngsuranDetail() {
  const { id: txId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [parafInput, setParafInput] = useState('');

  const data = useLiveQuery(async () => {
    if (!txId) return null;
    const tx = await db.transactions.get(txId);
    if (!tx) return null;
    
    const payments = await db.payments.where('transaction_id').equals(txId).toArray();
    const status = hitungStatusAngsuran(tx, payments, today);
    const kategori = tentukanKategori(tx, payments, today);
    
    return { tx, payments, status, kategori };
  }, [txId]);

  if (!data) return <div className="p-4 text-center">Loading...</div>;

  const { tx, payments, status, kategori } = data;

  const handleApprove = async () => {
    if (parafInput.trim()) {
      await db.transactions.update(txId!, {
        status_acc: 'approved',
        paraf_pimpinan: parafInput,
        sync_status: 'pending',
        notif_kolektor_seen: false
      });
      setShowApproveModal(false);
      setParafInput('');
    }
  };

  const handleReject = async () => {
    await db.transactions.update(txId!, {
      status_acc: 'rejected',
      sync_status: 'pending',
      notif_kolektor_seen: false
    });
    setShowRejectModal(false);
  };

  const handleUploadPromise = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await db.transactions.update(txId!, {
          foto_promise: reader.result as string,
          sync_status: 'pending'
        });
      };
      reader.readAsDataURL(file);
    }
  };

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
              <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">Batal</button>
              <button onClick={handleApprove} disabled={!parafInput.trim()} className="flex-1 py-2 rounded-lg bg-green-600 text-white font-medium disabled:opacity-50">Setujui</button>
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
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">Batal</button>
              <button onClick={handleReject} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium">Ya, Tolak</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-2">
        <ArrowLeft size={20} /> Kembali
      </button>

      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-xl text-xs font-bold">
          {kategori}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{tx.nama_nasabah}</h2>
        <div className="flex items-start gap-2 text-gray-500 text-sm mb-3">
          <MapPin size={16} className="shrink-0 mt-0.5" />
          <p>{tx.alamat}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-500 mb-1">Pencairan</p>
            <p className="font-medium text-sm">{format(new Date(tx.tanggal_pencairan), 'dd MMM yyyy', { locale: id })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Jatuh Tempo</p>
            <p className="font-medium text-sm">{format(new Date(tx.tanggal_lunas), 'dd MMM yyyy', { locale: id })}</p>
          </div>
        </div>
      </div>

      {/* Pimpinan ACC UI */}
      {user?.role === 'pimpinan' && tx.status_acc === 'pending' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-yellow-400 space-y-4">
          <h3 className="font-bold text-gray-800 text-center border-b pb-2">Review Pengajuan Pinjaman</h3>
          
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Permohonan Pinjaman</p>
            <p className="font-bold text-xl text-blue-600">{formatRupiah(tx.permohonan_pinjaman)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Foto Pencairan</p>
              {tx.foto_pencairan ? (
                <img src={tx.foto_pencairan} alt="Pencairan" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">Tidak ada foto</div>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Foto KTP</p>
              {tx.foto_ktp ? (
                <img src={tx.foto_ktp} alt="KTP" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">Tidak ada foto</div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setShowRejectModal(true)}
              className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle size={20} /> Tolak
            </button>
            <button 
              onClick={() => setShowApproveModal(true)}
              className="flex-1 bg-green-600 text-white hover:bg-green-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <CheckCircle size={20} /> ACC Pinjaman
            </button>
          </div>
        </div>
      )}

      {/* Kolektor Foto Selfie UI */}
      {user?.role !== 'pimpinan' && tx.status_acc === 'approved' && !tx.foto_promise && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-3">
          <div className="flex gap-3 items-start">
            <CheckCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-blue-800 text-sm">Pinjaman Di-ACC</h4>
              <p className="text-xs text-blue-700 mt-1">Silakan unggah Foto Selfie Bersama Nasabah untuk melengkapi data.</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <label className="flex-1 flex flex-col items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors">
              <Camera size={20} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700">Kamera</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUploadPromise} />
            </label>
            <label className="flex-1 flex flex-col items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors">
              <ImageIcon size={20} className="text-purple-600" />
              <span className="text-xs font-bold text-purple-700">Galeri</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadPromise} />
            </label>
          </div>
        </div>
      )}

      {tx.status_acc === 'pending' && user?.role !== 'pimpinan' && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex gap-3 items-start">
          <Clock className="text-yellow-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-yellow-800 text-sm">Menunggu ACC Pimpinan</h4>
            <p className="text-xs text-yellow-700 mt-1">Pencairan ini belum disetujui oleh pimpinan.</p>
          </div>
        </div>
      )}

      {tx.status_acc === 'rejected' && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-start">
          <XCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-red-800 text-sm">Pengajuan Ditolak</h4>
            <p className="text-xs text-red-700 mt-1">Pengajuan pinjaman ini telah ditolak oleh pimpinan.</p>
          </div>
        </div>
      )}

      {/* Auto Calculated Angsuran (KRITIS) */}
      <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
        <div className="bg-red-600 text-white p-3 text-center font-bold text-sm">
          SISTEM ANGSURAN OTOMATIS
        </div>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-red-100 pb-2">
            <span className="text-red-800 font-medium text-sm">Saldo Awal (120%)</span>
            <span className="text-red-900 font-bold">{formatRupiah(status.saldo_awal)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-red-100 pb-2">
            <span className="text-red-800 font-medium text-sm">Angsuran Tengah Bulan</span>
            <span className="text-red-900 font-bold text-lg">{formatRupiah(status.angsuran_tengah_bulan)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-red-100 pb-2">
            <span className="text-red-800 font-medium text-sm">Saldo Tengah Bulan</span>
            <span className="text-red-900 font-bold text-lg">{formatRupiah(status.saldo_tengah_bulan)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-red-800 font-medium text-sm">Saldo Akhir Bulan</span>
            <span className="text-red-900 font-bold text-lg">{formatRupiah(status.saldo_akhir_bulan)}</span>
          </div>
        </div>
      </div>

      {/* Status Saat Ini */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard size={18} className="text-blue-600" /> Status Berjalan
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Total Dibayar</p>
            <p className="font-bold text-green-600">{formatRupiah(status.total_dibayar)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Sisa Saldo</p>
            <p className="font-bold text-orange-600">{formatRupiah(status.saldo_saat_ini)}</p>
          </div>
        </div>
      </div>

      {/* Action */}
      <button 
        onClick={() => navigate(`/pembayaran/${tx.id}`)}
        disabled={status.saldo_saat_ini <= 0 || (tx.status_acc === 'approved' && !tx.foto_promise)}
        className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-400"
      >
        <Camera size={20} /> Input Pembayaran
      </button>

      {/* Riwayat */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" /> Riwayat Pembayaran
        </h3>
        <div className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Belum ada pembayaran</p>
          ) : (
            payments.sort((a, b) => new Date(b.tanggal_pembayaran).getTime() - new Date(a.tanggal_pembayaran).getTime()).map(p => (
              <div key={p.id} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm text-gray-800">{format(new Date(p.tanggal_pembayaran), 'dd MMM yyyy', { locale: id })}</p>
                  {p.foto_bukti && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Ada Bukti</span>}
                </div>
                <p className="font-bold text-green-600">+{formatRupiah(p.nominal)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
