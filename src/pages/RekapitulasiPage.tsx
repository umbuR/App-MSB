import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FileText, Calendar, BarChart3 } from 'lucide-react';
import { formatRupiah } from '../lib/logic';

export default function RekapitulasiPage() {
  const [viewMode, setViewMode] = useState<'mingguan' | 'bulanan'>('mingguan');
  const today = new Date();

  const startWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endWeek = endOfWeek(today, { weekStartsOn: 1 });
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);

  const currentInterval = viewMode === 'mingguan' 
    ? { start: startWeek, end: endWeek }
    : { start: startMonth, end: endMonth };

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const stortings = useLiveQuery(() => db.storting.toArray()) || [];
  const pengeluarans = useLiveQuery(() => db.pengeluaran.toArray()) || [];
  const tunais = useLiveQuery(() => db.tunai.toArray()) || [];

  const isDateInInterval = (dateString: string) => {
    if (!dateString) return false;
    try {
      const date = parseISO(dateString);
      return isWithinInterval(date, currentInterval);
    } catch (e) {
      return false;
    }
  };

  const filteredTransactions = transactions.filter(t => isDateInInterval(t.tanggal_pencairan));
  const filteredStortings = stortings.filter(s => isDateInInterval(s.date));
  const filteredPengeluarans = pengeluarans.filter(p => isDateInInterval(p.tanggal));
  const filteredTunais = tunais.filter(t => isDateInInterval(t.tanggal));

  const totalNasabah = filteredTransactions.length;
  const totalPencairan = filteredTransactions.reduce((sum, t) => sum + t.acc_pinjaman, 0);
  const totalStorting = filteredStortings.reduce((sum, s) => sum + s.storting_kini, 0);
  const totalPengeluaran = filteredPengeluarans.reduce((sum, p) => sum + p.nominal, 0);
  
  const sortedTunais = [...filteredTunais].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  const latestTunai = sortedTunais.length > 0 ? sortedTunais[0] : null;
  const sisaKas = latestTunai ? latestTunai.uang_yang_ada : 0;

  const totalKasbon = filteredTunais.reduce((sum, t) => sum + t.kasbon, 0);
  const totalUangYangAda = filteredTunais.reduce((sum, t) => sum + t.uang_yang_ada, 0);
  const totalDrop = filteredStortings.reduce((sum, s) => sum + s.drop_kini, 0);

  const totalSelisih = totalStorting + totalKasbon - totalDrop - totalPengeluaran - totalUangYangAda;

  return (
    <div className="space-y-6">
      <header className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-indigo-600" />
          Rekapitulasi
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan data keuangan
        </p>
      </header>

      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        <button
          onClick={() => setViewMode('mingguan')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'mingguan' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Mingguan
        </button>
        <button
          onClick={() => setViewMode('bulanan')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'bulanan' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Bulanan
        </button>
      </div>

      <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg flex items-center gap-3">
        <Calendar className="text-indigo-200" />
        <div>
          <p className="text-indigo-100 text-sm">Periode {viewMode === 'mingguan' ? 'Minggu Ini' : 'Bulan Ini'}</p>
          <p className="font-medium">
            {format(currentInterval.start, 'dd MMM yyyy', { locale: idLocale })} - {format(currentInterval.end, 'dd MMM yyyy', { locale: idLocale })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Nasabah</p>
          <p className="text-xl font-bold text-gray-800">{totalNasabah} Orang</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Sisa Kas (Terakhir)</p>
          <p className="text-xl font-bold text-emerald-600">{formatRupiah(sisaKas)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <BarChart3 className="text-gray-500" size={20} />
          <h3 className="font-bold text-gray-800">Rincian Keuangan</h3>
        </div>
        <div className="p-0">
          <div className="flex justify-between items-center p-4 border-b border-gray-50">
            <span className="text-gray-600">Total Pencairan</span>
            <span className="font-bold text-red-600">{formatRupiah(totalPencairan)}</span>
          </div>
          <div className="flex justify-between items-center p-4 border-b border-gray-50">
            <span className="text-gray-600">Total Storting</span>
            <span className="font-bold text-emerald-600">{formatRupiah(totalStorting)}</span>
          </div>
          <div className="flex justify-between items-center p-4 border-b border-gray-50">
            <span className="text-gray-600">Total Pengeluaran</span>
            <span className="font-bold text-red-600">{formatRupiah(totalPengeluaran)}</span>
          </div>
          <div className="flex justify-between items-center p-4 border-b border-gray-50">
            <span className="text-gray-600">Total Kasbon / Tambahan</span>
            <span className="font-bold text-blue-600">{formatRupiah(totalKasbon)}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50">
            <span className="text-gray-800 font-medium">Akumulasi Selisih Tunai</span>
            <span className={`font-bold ${totalSelisih < 0 ? 'text-blue-600' : totalSelisih > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalSelisih < 0 ? 'Lebih ' : totalSelisih > 0 ? 'Tekor ' : 'Pas '}
              {formatRupiah(Math.abs(totalSelisih))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
