import { FileSpreadsheet } from 'lucide-react';

export default function LaporanRekapanPage() {
  return (
    <div className="space-y-6">
      <header className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="text-green-600" />
          Laporan Rekapan
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Rekapan data harian dan mingguan
        </p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
        <p>Fitur Laporan Rekapan sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
