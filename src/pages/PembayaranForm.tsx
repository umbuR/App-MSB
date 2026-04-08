import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { formatRupiah } from '../lib/logic';
import { Camera, CheckCircle, ArrowLeft } from 'lucide-react';

export default function PembayaranForm() {
  const { id: txId } = useParams();
  const navigate = useNavigate();
  const [nominal, setNominal] = useState('');
  const [foto, setFoto] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId || !nominal || !foto) return;

    const nominalNum = Number(nominal);

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

    const todayStr = new Date().toISOString().split('T')[0];

    await db.payments.add({
      id: crypto.randomUUID(),
      transaction_id: txId,
      tanggal_pembayaran: new Date().toISOString(),
      nominal: nominalNum,
      foto_bukti: foto,
      lat,
      lng,
      sync_status: 'pending'
    });

    // Update Storting Kini
    const storting = await db.storting.where('date').equals(todayStr).first();
    if (storting) {
      const newStortingKini = storting.storting_kini + nominalNum;
      const newStortingBerjalan = storting.storting_berjalan + nominalNum;
      const persentase = storting.target_kini > 0 ? (newStortingKini / storting.target_kini) * 100 : 0;
      
      await db.storting.update(storting.id!, {
        storting_kini: newStortingKini,
        storting_berjalan: newStortingBerjalan,
        persentase
      });
    } else {
      // Jika belum ada target hari ini, buat record kosong dengan storting
      await db.storting.add({
        id: crypto.randomUUID(),
        date: todayStr,
        target_lalu: 0, target_kini: 0, target_berjalan: 0,
        storting_lalu: 0, storting_kini: nominalNum, storting_berjalan: nominalNum,
        drop_lalu: 0, drop_kini: 0, drop_berjalan: 0,
        persentase: 0,
        paraf_acc: '',
        sync_status: 'pending'
      });
    }

    navigate(`/transaksi/${txId}`);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-2">
        <ArrowLeft size={20} /> Kembali
      </button>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4">Input Pembayaran</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nominal Pembayaran (Rp)</label>
            <input 
              required 
              type="number" 
              value={nominal} 
              onChange={e => setNominal(e.target.value)} 
              className="w-full p-4 text-xl font-bold rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="0"
            />
            {nominal && <p className="text-sm text-green-600 mt-1 font-medium">{formatRupiah(Number(nominal))}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Foto Bukti Pembayaran / Nasabah</label>
            {foto ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-green-500">
                <img src={foto} alt="Bukti" className="w-full h-64 object-cover" />
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                  <CheckCircle size={20} />
                </div>
                <button 
                  type="button"
                  onClick={() => setFoto(null)}
                  className="absolute bottom-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold"
                >
                  Ulangi
                </button>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 h-64 flex flex-col items-center justify-center hover:bg-gray-200 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="cameraInput-pembayaran"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="cameraInput-pembayaran"
                  className="flex flex-col items-center gap-3 cursor-pointer w-full h-full justify-center"
                >
                  <div className="bg-blue-100 text-blue-600 p-4 rounded-full shadow-sm">
                    <Camera size={32} />
                  </div>
                  <span className="text-sm font-bold text-gray-600 text-center px-4">Ambil Foto Bukti</span>
                </label>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={!nominal || !foto}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:bg-gray-400"
          >
            Simpan Pembayaran
          </button>
        </form>
      </div>
    </div>
  );
}
