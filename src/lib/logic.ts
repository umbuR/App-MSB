import { addDays, isSunday, nextMonday, parseISO, format, differenceInDays } from 'date-fns';
import { Transaction, Payment } from './db';

// 1. Hitung Saldo Awal
export const hitungSaldoAwal = (acc_pinjaman: number) => {
  return acc_pinjaman * 1.2;
};

// 2. Logika Periode (Geser jika Minggu/Libur)
export const getTanggalPeriode = (dateStr: string, periode: 1 | 2) => {
  const date = parseISO(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  
  let targetDate = new Date(year, month, periode === 1 ? 15 : new Date(year, month + 1, 0).getDate());
  
  // Jika hari Minggu, geser ke Senin
  if (isSunday(targetDate)) {
    targetDate = nextMonday(targetDate);
  }
  
  return format(targetDate, 'yyyy-MM-dd');
};

// 3. Hitung Angsuran & Saldo
export const hitungStatusAngsuran = (transaction: Transaction, payments: Payment[], currentDateStr: string) => {
  const saldoAwal = transaction.saldo_awal;
  const totalDibayar = payments.reduce((sum, p) => sum + p.nominal, 0);
  const saldoSaatIni = saldoAwal - totalDibayar;
  
  // Asumsi: Angsuran dibagi rata berdasarkan jumlah hari
  const angsuranHarian = saldoAwal / transaction.jumlah_hari;
  
  // Hitung target angsuran tengah bulan (akumulasi dari tanggal pencairan sampai tgl 15)
  const tglPencairan = parseISO(transaction.tanggal_pencairan);
  const tglTengahBulan = parseISO(getTanggalPeriode(currentDateStr, 1));
  
  let hariBerjalanTengahBulan = differenceInDays(tglTengahBulan, tglPencairan);
  if (hariBerjalanTengahBulan < 0) hariBerjalanTengahBulan = 0;
  if (hariBerjalanTengahBulan > transaction.jumlah_hari) hariBerjalanTengahBulan = transaction.jumlah_hari;
  
  const targetAngsuranTengahBulan = hariBerjalanTengahBulan * angsuranHarian;
  const saldoTengahBulan = saldoAwal - targetAngsuranTengahBulan;
  
  return {
    saldo_awal: saldoAwal,
    total_dibayar: totalDibayar,
    saldo_saat_ini: saldoSaatIni,
    angsuran_tengah_bulan: targetAngsuranTengahBulan,
    saldo_tengah_bulan: saldoTengahBulan,
    saldo_akhir_bulan: 0 // Simplifikasi, bisa dihitung mirip tengah bulan
  };
};

// 4. Kategori Nasabah
export const tentukanKategori = (transaction: Transaction, payments: Payment[], currentDateStr: string) => {
  const status = hitungStatusAngsuran(transaction, payments, currentDateStr);
  
  if (status.saldo_saat_ini <= 0) return 'LUNAS';
  
  const tglPencairan = parseISO(transaction.tanggal_pencairan);
  const tglCurrent = parseISO(currentDateStr);
  
  const getPeriodIndex = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return year * 24 + month * 2 + (day <= 15 ? 0 : 1);
  };
  
  const periodPencairan = getPeriodIndex(tglPencairan);
  const periodCurrent = getPeriodIndex(tglCurrent);
  
  const periodsPassed = Math.max(0, periodCurrent - periodPencairan);
  
  if (periodsPassed === 0) return 'PB';
  if (periodsPassed === 1) return 'L II';
  if (periodsPassed === 2) return 'L I';
  if (periodsPassed === 3) return 'CCM';
  if (periodsPassed === 4) return 'CM';
  return 'ML';
};

// 5. Format Currency
export const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
};
