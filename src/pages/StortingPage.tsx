import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { formatRupiah } from '../lib/logic';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Target, Save } from 'lucide-react';

export default function StortingPage() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [targetKini, setTargetKini] = useState('');

  const storting = useLiveQuery(
    () => db.storting.where('date').equals(todayStr).first()
  );

  useEffect(() => {
    if (storting && storting.target_kini > 0 && !targetKini) {
      setTargetKini(storting.target_kini.toString());
    }
  }, [storting]);

  const handleSaveTarget = async () => {
    const target = Number(targetKini);
    if (storting) {
      const persentase = target > 0 ? (storting.storting_kini / target) * 100 : 0;
      await db.storting.update(storting.id!, {
        target_kini: target,
        target_berjalan: storting.target_lalu + target,
        persentase
      });
    } else {
      await db.storting.add({
        id: crypto.randomUUID(),
        date: todayStr,
        target_lalu: 0, target_kini: target, target_berjalan: target,
        storting_lalu: 0, storting_kini: 0, storting_berjalan: 0,
        drop_lalu: 0, drop_kini: 0, drop_berjalan: 0,
        persentase: 0,
        paraf_acc: '',
        sync_status: 'pending'
      });
    }
    alert('Target berhasil disimpan');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Target size={20} className="text-blue-600" /> Target Hari Ini
        </h2>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={targetKini}
            onChange={e => setTargetKini(e.target.value)}
            placeholder="Masukkan Target (Rp)"
            className="flex-1 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={handleSaveTarget}
            className="bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center"
          >
            <Save size={20} />
          </button>
        </div>
        {targetKini && <p className="text-sm text-gray-500 mt-2">Target: {formatRupiah(Number(targetKini))}</p>}
      </div>

      {/* Rekap Storting */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Rekapitulasi Storting</h3>
          <p className="text-xs text-gray-500">{format(new Date(), 'dd MMMM yyyy', { locale: id })}</p>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Target */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">A. Target</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Target Lalu</span><span className="font-medium">{formatRupiah(storting?.target_lalu || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Target Kini</span><span className="font-medium text-blue-600">{formatRupiah(storting?.target_kini || 0)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2"><span className="font-bold">Target Berjalan</span><span className="font-bold">{formatRupiah(storting?.target_berjalan || 0)}</span></div>
            </div>
          </div>

          {/* Storting */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">B. Storting</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Storting Lalu</span><span className="font-medium">{formatRupiah(storting?.storting_lalu || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Storting Kini</span><span className="font-medium text-green-600">{formatRupiah(storting?.storting_kini || 0)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2"><span className="font-bold">Storting Berjalan</span><span className="font-bold">{formatRupiah(storting?.storting_berjalan || 0)}</span></div>
            </div>
          </div>

          {/* Drop */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">C. Drop</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Drop Lalu</span><span className="font-medium">{formatRupiah(storting?.drop_lalu || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Drop Kini</span><span className="font-medium text-orange-600">{formatRupiah(storting?.drop_kini || 0)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2"><span className="font-bold">Drop Berjalan</span><span className="font-bold">{formatRupiah(storting?.drop_berjalan || 0)}</span></div>
            </div>
          </div>

          {/* Persentase */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
            <span className="font-bold text-blue-800">Persentase</span>
            <span className={`text-xl font-black ${(storting?.persentase || 0) >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {(storting?.persentase || 0).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
