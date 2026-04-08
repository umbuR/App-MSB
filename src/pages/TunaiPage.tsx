import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Banknote, Save, Calculator } from 'lucide-react';
import { formatRupiah } from '../lib/logic';

export default function TunaiPage() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const storting = useLiveQuery(() => db.storting.where('date').equals(today).first());
  const pengeluaranHariIni = useLiveQuery(() => db.pengeluaran.where('tanggal').equals(today).toArray(), []);
  const tunaiRecord = useLiveQuery(() => db.tunai.where('tanggal').equals(today).first());

  const [kasbonStr, setKasbonStr] = useState('');
  const [uangYangAdaStr, setUangYangAdaStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tunaiRecord) {
      setKasbonStr(tunaiRecord.kasbon.toString());
      setUangYangAdaStr(tunaiRecord.uang_yang_ada.toString());
    }
  }, [tunaiRecord]);

  const stortingKini = storting?.storting_kini || 0;
  const dropKini = storting?.drop_kini || 0;
  const totalPengeluaran = pengeluaranHariIni?.reduce((sum, item) => sum + item.nominal, 0) || 0;

  const kasbon = parseInt(kasbonStr.replace(/\D/g, '')) || 0;
  const uangYangAda = parseInt(uangYangAdaStr.replace(/\D/g, '')) || 0;

  // Tunai (Storting+kasbon-Drop-pengeluaran-Uang yang ada)
  const selisihTunai = stortingKini + kasbon - dropKini - totalPengeluaran - uangYangAda;
  
  let statusSelisih = 'Pas';
  let colorSelisih = 'text-green-600';
  let bgSelisih = 'bg-green-50 border-green-200';
  if (selisihTunai < 0) {
    statusSelisih = 'Lebih';
    colorSelisih = 'text-blue-600';
    bgSelisih = 'bg-blue-50 border-blue-200';
  } else if (selisihTunai > 0) {
    statusSelisih = 'Tekor';
    colorSelisih = 'text-red-600';
    bgSelisih = 'bg-red-50 border-red-200';
  }

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (tunaiRecord && tunaiRecord.id) {
        await db.tunai.update(tunaiRecord.id, {
          kasbon,
          uang_yang_ada: uangYangAda,
          sync_status: 'pending'
        });
      } else {
        await db.tunai.add({
          id: crypto.randomUUID(),
          tanggal: today,
          kasbon,
          uang_yang_ada: uangYangAda,
          sync_status: 'pending'
        });
      }
      setAlertMessage('Data Tunai berhasil disimpan');
    } catch (error) {
      console.error(error);
      setAlertMessage('Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
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
            <button onClick={() => setAlertMessage(null)} className="w-full py-2 rounded-lg bg-emerald-600 text-white font-medium">Tutup</button>
          </div>
        </div>
      )}

      <header className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Banknote className="text-emerald-600" />
          Tunai
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
        </p>
      </header>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <span className="text-gray-600">Storting (Kini)</span>
          <span className="font-bold text-gray-800">{formatRupiah(stortingKini)}</span>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kasbon (Sisa kas kemarin / Tambahan modal)</label>
          <input
            type="number"
            value={kasbonStr}
            onChange={(e) => setKasbonStr(e.target.value)}
            placeholder="0"
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex justify-between items-center py-3 border-y border-gray-100">
          <span className="text-gray-600">Drop (Total Pencairan)</span>
          <span className="font-bold text-red-600">- {formatRupiah(dropKini)}</span>
        </div>

        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <span className="text-gray-600">Pengeluaran</span>
          <span className="font-bold text-red-600">- {formatRupiah(totalPengeluaran)}</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Uang yang ada (Fisik)</label>
          <input
            type="number"
            value={uangYangAdaStr}
            onChange={(e) => setUangYangAdaStr(e.target.value)}
            placeholder="0"
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className={`p-5 rounded-2xl border ${bgSelisih} shadow-sm`}>
        <div className="flex items-center gap-2 mb-2">
          <Calculator className={colorSelisih} size={20} />
          <h3 className={`font-bold ${colorSelisih}`}>Status Tunai: {statusSelisih}</h3>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-sm text-gray-600">Selisih:</span>
          <span className={`text-2xl font-black ${colorSelisih}`}>
            {formatRupiah(Math.abs(selisihTunai))}
          </span>
        </div>
      </div>

      <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
        <h3 className="text-sm font-medium text-emerald-800 mb-1">Sisa Kas (Uang yang ada hari ini)</h3>
        <p className="text-3xl font-bold text-emerald-900">{formatRupiah(uangYangAda)}</p>
      </div>

      <button
        onClick={handleSave}
        disabled={isSubmitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
      >
        <Save size={20} />
        Simpan Data Tunai
      </button>
    </div>
  );
}
