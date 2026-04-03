import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { hitungSaldoAwal } from '../lib/logic';
import { Camera, CheckCircle } from 'lucide-react';

export default function TransaksiForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama_nasabah: '',
    alamat: '',
    jumlah_hari: 30,
    permohonan_pinjaman: '',
    acc_pinjaman: '',
    paraf_acc: ''
  });

  const [photos, setPhotos] = useState({
    pencairan: null as string | null,
    promise: null as string | null,
    ktp: null as string | null
  });

  const handleFileChange = (type: keyof typeof photos, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const accPinjaman = Number(formData.acc_pinjaman);
    const saldoAwal = hitungSaldoAwal(accPinjaman);
    
    // Get GPS
    let lat = 0, lng = 0;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (err) {
      console.warn("GPS failed", err);
    }

    const today = new Date();
    const tglLunas = new Date(today);
    tglLunas.setDate(tglLunas.getDate() + Number(formData.jumlah_hari));

    const newTx = {
      id: crypto.randomUUID(),
      tanggal_pencairan: today.toISOString().split('T')[0],
      nama_nasabah: formData.nama_nasabah,
      alamat: formData.alamat,
      tanggal_lunas: tglLunas.toISOString().split('T')[0],
      jumlah_hari: Number(formData.jumlah_hari),
      permohonan_pinjaman: Number(formData.permohonan_pinjaman),
      target_masuk: 0, // Simplified
      target_keluar: 0, // Simplified
      acc_pinjaman: accPinjaman,
      paraf_acc: formData.paraf_acc,
      foto_pencairan: photos.pencairan || undefined,
      foto_promise: photos.promise || undefined,
      foto_ktp: photos.ktp || undefined,
      lat,
      lng,
      sync_status: 'pending' as const,
      saldo_awal: saldoAwal,
      kategori: 'PB'
    };

    await db.transactions.add(newTx);
    
    // Update Storting Drop Kini
    const todayStr = today.toISOString().split('T')[0];
    const storting = await db.storting.where('date').equals(todayStr).first();
    if (storting) {
      await db.storting.update(storting.id!, {
        drop_kini: storting.drop_kini + accPinjaman,
        drop_berjalan: storting.drop_berjalan + accPinjaman
      });
    } else {
      await db.storting.add({
        id: crypto.randomUUID(),
        date: todayStr,
        target_lalu: 0, target_kini: 0, target_berjalan: 0,
        storting_lalu: 0, storting_kini: 0, storting_berjalan: 0,
        drop_lalu: 0, drop_kini: accPinjaman, drop_berjalan: accPinjaman,
        persentase: 0,
        paraf_acc: 'auto',
        sync_status: 'pending'
      });
    }

    navigate('/transaksi');
  };

  const renderCamera = (type: keyof typeof photos, label: string) => {
    if (photos[type]) {
      return (
        <div className="relative rounded-xl overflow-hidden border-2 border-green-500">
          <img src={photos[type]!} alt={label} className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
            <CheckCircle size={20} />
          </div>
          <button 
            type="button"
            onClick={() => setPhotos(prev => ({ ...prev, [type]: null }))}
            className="absolute bottom-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold"
          >
            Ulangi
          </button>
        </div>
      );
    }

    return (
      <div className="relative rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 h-48 flex flex-col items-center justify-center hover:bg-gray-200 transition-colors">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          id={`cameraInput-${type}`}
          onChange={(e) => handleFileChange(type, e)}
        />
        <label
          htmlFor={`cameraInput-${type}`}
          className="flex flex-col items-center gap-3 cursor-pointer w-full h-full justify-center"
        >
          <div className="bg-blue-100 text-blue-600 p-4 rounded-full shadow-sm">
            <Camera size={32} />
          </div>
          <span className="text-sm font-bold text-gray-600 text-center px-4">Ambil {label}</span>
        </label>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">
        {step === 1 && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-bold text-gray-800 mb-4">Data Pencairan</h2>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nama Nasabah</label>
              <input required type="text" value={formData.nama_nasabah} onChange={e => setFormData({...formData, nama_nasabah: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Alamat</label>
              <textarea required value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" rows={2}></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Permohonan (Rp)</label>
                <input required type="number" value={formData.permohonan_pinjaman} onChange={e => setFormData({...formData, permohonan_pinjaman: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ACC Pinjaman (Rp)</label>
                <input required type="number" value={formData.acc_pinjaman} onChange={e => setFormData({...formData, acc_pinjaman: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Paraf ACC</label>
              <input required type="text" value={formData.paraf_acc} onChange={e => setFormData({...formData, paraf_acc: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4">
              Lanjut ke Foto
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-bold text-gray-800">Dokumentasi Wajib</h2>
              
              <div className="space-y-4">
                {renderCamera('pencairan', 'Foto Pencairan')}
                {renderCamera('promise', 'Foto Surat Promise')}
                {renderCamera('ktp', 'Foto KTP')}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl">
                Kembali
              </button>
              <button 
                type="submit" 
                disabled={!photos.pencairan || !photos.promise || !photos.ktp}
                className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:bg-gray-400"
              >
                Simpan Data
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
