import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { hitungStatusAngsuran, formatRupiah, tentukanKategori } from '../lib/logic';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowLeft, MapPin, Calendar, CreditCard, Camera } from 'lucide-react';

export default function AngsuranDetail() {
  const { id: txId } = useParams();
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

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

  return (
    <div className="space-y-4">
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
        disabled={status.saldo_saat_ini <= 0}
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
