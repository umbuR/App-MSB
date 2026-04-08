import { FileBarChart } from 'lucide-react';

export default function RekapanKecilPage() {
  return (
    <div className="space-y-6">
      <header className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileBarChart className="text-orange-600" />
          Rekapan Kecil
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan data skala kecil
        </p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
        <p>Fitur Rekapan Kecil sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
