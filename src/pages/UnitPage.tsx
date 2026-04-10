import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Building2, Save, Users, Target as TargetIcon, Globe, Wallet, TrendingDown, Percent } from 'lucide-react';
import { formatRupiah } from '../lib/logic';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function UnitPage() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const unitReport = useLiveQuery(() => db.unit_reports.where('tanggal').equals(today).first());

  const [formData, setFormData] = useState({
    anggota_lancar_lalu: '',
    anggota_lancar_masuk: '',
    anggota_lancar_keluar: '',
    anggota_macet_lalu: '',
    anggota_macet_keluar: '',
    target_lancar_lalu: '',
    target_lancar_masuk: '',
    target_lancar_keluar: '',
    target_macet_lalu: '',
    target_macet_keluar: '',
    target_global_lalu: '',
    target_global_kini: '',
    storting_lalu: '',
    storting_kini: '',
    drop_lalu: '',
    drop_kini: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd');

      const yesterdayReport = await db.unit_reports.where('tanggal').equals(yesterdayStr).first();
      
      const todayTxs = await db.transactions.where('tanggal_pencairan').equals(today).toArray();
      const allTxs = await db.transactions.toArray();
      
      const lunasTxsToday = [];
      for (const tx of allTxs) {
        const txPayments = await db.payments.where('transaction_id').equals(tx.id!).toArray();
        const totalPaid = txPayments.reduce((sum, p) => sum + p.nominal, 0);
        if (totalPaid >= tx.saldo_awal) {
          const lastPayment = txPayments.sort((a, b) => b.tanggal_pembayaran.localeCompare(a.tanggal_pembayaran))[0];
          if (lastPayment && lastPayment.tanggal_pembayaran.startsWith(today)) {
            lunasTxsToday.push(tx);
          }
        }
      }

      const anggotaLancarMasuk = todayTxs.length;
      const anggotaLancarKeluar = lunasTxsToday.filter(t => t.kategori !== 'ML').length;
      const anggotaMacetKeluar = lunasTxsToday.filter(t => t.kategori === 'ML').length;

      const targetLancarMasuk = todayTxs.reduce((sum, t) => sum + (t.acc_pinjaman * 0.03), 0);
      const targetLancarKeluar = lunasTxsToday.filter(t => t.kategori !== 'ML').reduce((sum, t) => sum + (t.acc_pinjaman * 0.03), 0);
      const targetMacetKeluar = lunasTxsToday.filter(t => t.kategori === 'ML').reduce((sum, t) => sum + (t.acc_pinjaman * 0.03), 0);

      const stortingToday = await db.storting.where('date').equals(today).first();
      
      let yLancarJumlah = 0;
      let yMacetJumlah = 0;
      let yTargetLancarJumlah = 0;
      let yTargetMacetJumlah = 0;
      let yStortingBerjalan = 0;
      let yDropBerjalan = 0;

      if (yesterdayReport) {
        yLancarJumlah = yesterdayReport.anggota_lancar_jumlah;
        yMacetJumlah = yesterdayReport.anggota_macet_jumlah;
        yTargetLancarJumlah = yesterdayReport.target_lancar_lalu + yesterdayReport.target_lancar_masuk - yesterdayReport.target_lancar_keluar;
        yTargetMacetJumlah = yesterdayReport.target_macet_jumlah;
        yStortingBerjalan = yesterdayReport.storting_berjalan;
        yDropBerjalan = yesterdayReport.drop_berjalan;
      }

      setFormData(prev => ({
        anggota_lancar_lalu: unitReport ? unitReport.anggota_lancar_lalu.toString() : yLancarJumlah.toString(),
        anggota_lancar_masuk: anggotaLancarMasuk.toString(),
        anggota_lancar_keluar: anggotaLancarKeluar.toString(),
        
        anggota_macet_lalu: unitReport ? unitReport.anggota_macet_lalu.toString() : yMacetJumlah.toString(),
        anggota_macet_keluar: anggotaMacetKeluar.toString(),

        target_lancar_lalu: unitReport ? unitReport.target_lancar_lalu.toString() : yTargetLancarJumlah.toString(),
        target_lancar_masuk: targetLancarMasuk.toString(),
        target_lancar_keluar: targetLancarKeluar.toString(),

        target_macet_lalu: unitReport ? unitReport.target_macet_lalu.toString() : yTargetMacetJumlah.toString(),
        target_macet_keluar: targetMacetKeluar.toString(),

        target_global_lalu: unitReport ? unitReport.target_global_lalu.toString() : prev.target_global_lalu,
        target_global_kini: unitReport ? unitReport.target_global_kini.toString() : yTargetLancarJumlah.toString(),

        storting_lalu: unitReport ? unitReport.storting_lalu.toString() : yStortingBerjalan.toString(),
        storting_kini: stortingToday?.storting_kini?.toString() || '0',

        drop_lalu: unitReport ? unitReport.drop_lalu.toString() : yDropBerjalan.toString(),
        drop_kini: stortingToday?.drop_kini?.toString() || '0',
      }));
    };

    loadData();
  }, [today, unitReport]);

  if (user?.role !== 'pimpinan') {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculations
  const parseNum = (val: string) => parseInt(val.replace(/\D/g, '')) || 0;

  const anggota_lancar_jumlah = parseNum(formData.anggota_lancar_lalu) + parseNum(formData.anggota_lancar_masuk) - parseNum(formData.anggota_lancar_keluar);
  const anggota_macet_jumlah = parseNum(formData.anggota_macet_lalu) - parseNum(formData.anggota_macet_keluar);
  
  const target_lancar_jumlah = parseNum(formData.target_lancar_lalu) + parseNum(formData.target_lancar_masuk) - parseNum(formData.target_lancar_keluar);
  const target_macet_jumlah = parseNum(formData.target_macet_lalu) - parseNum(formData.target_macet_keluar);

  const target_global_berjalan = parseNum(formData.target_global_lalu) + parseNum(formData.target_global_kini);
  const storting_berjalan = parseNum(formData.storting_lalu) + parseNum(formData.storting_kini);
  const drop_berjalan = parseNum(formData.drop_lalu) + parseNum(formData.drop_kini);
  
  const persentase = target_global_berjalan > 0 ? (storting_berjalan / target_global_berjalan) * 100 : 0;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const dataToSave = {
        tanggal: today,
        anggota_lancar_lalu: parseNum(formData.anggota_lancar_lalu),
        anggota_lancar_masuk: parseNum(formData.anggota_lancar_masuk),
        anggota_lancar_keluar: parseNum(formData.anggota_lancar_keluar),
        anggota_lancar_jumlah,
        anggota_macet_lalu: parseNum(formData.anggota_macet_lalu),
        anggota_macet_keluar: parseNum(formData.anggota_macet_keluar),
        anggota_macet_jumlah,
        target_lancar_lalu: parseNum(formData.target_lancar_lalu),
        target_lancar_masuk: parseNum(formData.target_lancar_masuk),
        target_lancar_keluar: parseNum(formData.target_lancar_keluar),
        target_macet_lalu: parseNum(formData.target_macet_lalu),
        target_macet_keluar: parseNum(formData.target_macet_keluar),
        target_macet_jumlah,
        target_global_lalu: parseNum(formData.target_global_lalu),
        target_global_kini: parseNum(formData.target_global_kini),
        target_global_berjalan,
        storting_lalu: parseNum(formData.storting_lalu),
        storting_kini: parseNum(formData.storting_kini),
        storting_berjalan,
        drop_lalu: parseNum(formData.drop_lalu),
        drop_kini: parseNum(formData.drop_kini),
        drop_berjalan,
        persentase,
        sync_status: 'pending' as const
      };

      if (unitReport && unitReport.id) {
        await db.unit_reports.update(unitReport.id, dataToSave);
      } else {
        await db.unit_reports.add({
          id: crypto.randomUUID(),
          ...dataToSave
        });
      }
      setAlertMessage('Data Unit berhasil disimpan');
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
            <button onClick={() => setAlertMessage(null)} className="w-full py-2 rounded-lg bg-purple-600 text-white font-medium">Tutup</button>
          </div>
        </div>
      )}

      <header className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="text-purple-600" />
          Laporan Unit
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
        </p>
      </header>

      <div className="space-y-4">
        {/* Anggota */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Users className="text-blue-500" size={20} />
            Anggota
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-3">Lancar</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lalu</label>
                  <input type="number" name="anggota_lancar_lalu" value={formData.anggota_lancar_lalu} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Masuk</label>
                  <input type="number" name="anggota_lancar_masuk" value={formData.anggota_lancar_masuk} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Keluar</label>
                  <input type="number" name="anggota_lancar_keluar" value={formData.anggota_lancar_keluar} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Jumlah</label>
                  <div className="w-full p-2 rounded-lg bg-gray-200 font-bold text-gray-700">{anggota_lancar_jumlah}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-3">Macet</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lalu</label>
                  <input type="number" name="anggota_macet_lalu" value={formData.anggota_macet_lalu} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Keluar</label>
                  <input type="number" name="anggota_macet_keluar" value={formData.anggota_macet_keluar} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Jumlah</label>
                  <div className="w-full p-2 rounded-lg bg-gray-200 font-bold text-gray-700">{anggota_macet_jumlah}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <TargetIcon className="text-red-500" size={20} />
            Target
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-3">Lancar</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lalu</label>
                  <input type="number" name="target_lancar_lalu" value={formData.target_lancar_lalu} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Masuk</label>
                  <input type="number" name="target_lancar_masuk" value={formData.target_lancar_masuk} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Keluar</label>
                  <input type="number" name="target_lancar_keluar" value={formData.target_lancar_keluar} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Jumlah</label>
                  <div className="w-full p-2 rounded-lg bg-gray-200 font-bold text-gray-700 truncate">{formatRupiah(target_lancar_jumlah)}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-3">Macet</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lalu</label>
                  <input type="number" name="target_macet_lalu" value={formData.target_macet_lalu} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Keluar</label>
                  <input type="number" name="target_macet_keluar" value={formData.target_macet_keluar} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Jumlah</label>
                  <div className="w-full p-2 rounded-lg bg-gray-200 font-bold text-gray-700 truncate">{formatRupiah(target_macet_jumlah)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target Global */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Globe className="text-indigo-500" size={20} />
            Target Global
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lalu</label>
              <input type="number" name="target_global_lalu" value={formData.target_global_lalu} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kini</label>
              <input type="number" name="target_global_kini" value={formData.target_global_kini} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Berjalan</label>
              <div className="w-full p-2 rounded-lg bg-gray-200 font-bold text-gray-700 text-sm truncate">{formatRupiah(target_global_berjalan)}</div>
            </div>
          </div>
        </div>

        {/* Storting */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Wallet className="text-emerald-500" size={20} />
            Storting
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lalu</label>
              <input type="number" name="storting_lalu" value={formData.storting_lalu} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kini</label>
              <input type="number" name="storting_kini" value={formData.storting_kini} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Berjalan</label>
              <div className="w-full p-2 rounded-lg bg-gray-200 font-bold text-gray-700 text-sm truncate">{formatRupiah(storting_berjalan)}</div>
            </div>
          </div>
        </div>

        {/* Drop */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <TrendingDown className="text-orange-500" size={20} />
            Drop
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lalu</label>
              <input type="number" name="drop_lalu" value={formData.drop_lalu} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kini</label>
              <input type="number" name="drop_kini" value={formData.drop_kini} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Berjalan</label>
              <div className="w-full p-2 rounded-lg bg-gray-200 font-bold text-gray-700 text-sm truncate">{formatRupiah(drop_berjalan)}</div>
            </div>
          </div>
        </div>

        {/* % */}
        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 shadow-sm flex justify-between items-center">
          <h2 className="font-bold text-purple-800 flex items-center gap-2">
            <Percent className="text-purple-600" size={20} />
            Persentase
          </h2>
          <span className="text-2xl font-black text-purple-600">{persentase.toFixed(2)}%</span>
        </div>

        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          <Save size={20} />
          Simpan Laporan Unit
        </button>
      </div>
    </div>
  );
}
