import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Receipt, Plus, Trash2, Camera, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PengeluaranPage() {
  const { user } = useAuth();
  const [kategori, setKategori] = useState('');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Ambil data pengeluaran hari ini
  const pengeluaranHariIni = useLiveQuery(
    () => db.pengeluaran.where('tanggal').equals(today).toArray(),
    []
  );

  // Hitung total pengeluaran hari ini
  const totalPengeluaran = pengeluaranHariIni?.reduce((sum, item) => sum + item.nominal, 0) || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBukti(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategori || !nominal) return;

    setIsSubmitting(true);
    try {
      await db.pengeluaran.add({
        id: crypto.randomUUID(),
        tanggal: today,
        kategori,
        nominal: parseInt(nominal.replace(/\D/g, '')),
        keterangan,
        foto_bukti: fotoBukti || undefined,
        kolektorId: user?.id,
        sync_status: 'pending'
      });

      // Reset form
      setKategori('');
      setNominal('');
      setKeterangan('');
      setFotoBukti(null);
    } catch (error) {
      console.error('Gagal menyimpan pengeluaran:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedId) {
      await db.pengeluaran.delete(selectedId);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  return (
    <div className="space-y-6 relative">
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg text-red-600">Hapus Pengeluaran</h3>
            <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus data pengeluaran ini?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => {setShowDeleteModal(false); setSelectedId(null);}} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">Batal</button>
              <button onClick={confirmDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Receipt className="text-blue-600" />
          Pengeluaran
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
        </p>
      </header>

      {/* Total Pengeluaran Card */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-red-100 text-sm font-medium mb-1">Total Pengeluaran Hari Ini</p>
        <h2 className="text-3xl font-bold">{formatRupiah(totalPengeluaran)}</h2>
      </div>

      {/* Form Input */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Input Pengeluaran Baru</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <input
              type="text"
              required
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              placeholder="Contoh: Bensin, Makan, dll"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
            <input
              type="number"
              required
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="0"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (Opsional)</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan tambahan..."
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Nota / Barang (Opsional)</label>
            {fotoBukti ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-green-500">
                <img src={fotoBukti} alt="Bukti Pengeluaran" className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                  <CheckCircle size={20} />
                </div>
                <button 
                  type="button"
                  onClick={() => setFotoBukti(null)}
                  className="absolute bottom-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold"
                >
                  Ulangi
                </button>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 h-32 flex flex-col items-center justify-center hover:bg-gray-200 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="cameraInput-pengeluaran"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="cameraInput-pengeluaran"
                  className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center"
                >
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-full shadow-sm">
                    <Camera size={24} />
                  </div>
                  <span className="text-sm font-bold text-gray-600 text-center px-4">Ambil Foto Nota</span>
                </label>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <Plus size={20} />
            Simpan Pengeluaran
          </button>
        </form>
      </div>

      {/* Daftar Pengeluaran Hari Ini */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Riwayat Hari Ini</h3>
        
        {pengeluaranHariIni === undefined ? (
          <p className="text-center text-gray-500 text-sm py-4">Memuat data...</p>
        ) : pengeluaranHariIni.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-4">Belum ada pengeluaran hari ini.</p>
        ) : (
          <div className="space-y-3">
            {pengeluaranHariIni.map((item) => (
              <div key={item.id} className="flex flex-col p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{item.kategori}</p>
                    {item.keterangan && <p className="text-xs text-gray-500 mt-0.5">{item.keterangan}</p>}
                    {item.foto_bukti && (
                      <span className="inline-block mt-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                        Ada Foto Bukti
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600">{formatRupiah(item.nominal)}</span>
                    <button 
                      onClick={() => handleDeleteClick(item.id!)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
