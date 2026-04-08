import { FilePieChart } from 'lucide-react';

export default function RekapanBesarPage() {
  return (
    <div className="space-y-6">
      <header className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FilePieChart className="text-purple-600" />
          Rekapan Besar
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan data skala besar dan global
        </p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
        <p>Fitur Rekapan Besar sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
