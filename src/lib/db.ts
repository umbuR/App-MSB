import Dexie, { type Table } from 'dexie';

export interface User {
  id?: number;
  email: string;
  password?: string;
  role: 'pimpinan' | 'kolektor' | 'rekap';
  name: string;
}

export interface Transaction {
  id?: string;
  tanggal_pencairan: string;
  nama_nasabah: string;
  alamat: string;
  tanggal_lunas: string;
  jumlah_hari: number;
  permohonan_pinjaman: number;
  target_masuk: number;
  target_keluar: number;
  acc_pinjaman: number;
  paraf_acc: string;
  foto_pencairan?: string;
  foto_promise?: string;
  foto_ktp?: string;
  lat?: number;
  lng?: number;
  sync_status: 'pending' | 'synced';
  // Calculated fields for easy access
  saldo_awal: number;
  kategori: string;
  // Approval fields
  status_acc?: 'pending' | 'approved' | 'rejected';
  paraf_pimpinan?: string;
  notif_kolektor_seen?: boolean;
}

export interface Payment {
  id?: string;
  transaction_id: string;
  tanggal_pembayaran: string;
  nominal: number;
  foto_bukti?: string;
  lat?: number;
  lng?: number;
  sync_status: 'pending' | 'synced';
}

export interface Storting {
  id?: string;
  date: string; // YYYY-MM-DD
  target_lalu: number;
  target_kini: number;
  target_berjalan: number;
  storting_lalu: number;
  storting_kini: number;
  storting_berjalan: number;
  drop_lalu: number;
  drop_kini: number;
  drop_berjalan: number;
  persentase: number;
  paraf_acc: string;
  sync_status: 'pending' | 'synced';
}

export interface Pengeluaran {
  id?: string;
  tanggal: string; // YYYY-MM-DD
  kategori: string;
  nominal: number;
  keterangan: string;
  kolektorId?: number;
  foto_bukti?: string;
  sync_status: 'pending' | 'synced';
}

export interface Tunai {
  id?: string;
  tanggal: string;
  kasbon: number;
  uang_yang_ada: number;
  sync_status: 'pending' | 'synced';
}

export interface UnitReport {
  id?: string;
  tanggal: string;
  anggota_lancar_lalu: number;
  anggota_lancar_masuk: number;
  anggota_lancar_keluar: number;
  anggota_lancar_jumlah: number;
  anggota_macet_lalu: number;
  anggota_macet_keluar: number;
  anggota_macet_jumlah: number;
  target_lancar_lalu: number;
  target_lancar_masuk: number;
  target_lancar_keluar: number;
  target_macet_lalu: number;
  target_macet_keluar: number;
  target_macet_jumlah: number;
  target_global_lalu: number;
  target_global_kini: number;
  target_global_berjalan: number;
  storting_lalu: number;
  storting_kini: number;
  storting_berjalan: number;
  drop_lalu: number;
  drop_kini: number;
  drop_berjalan: number;
  persentase: number;
  sync_status: 'pending' | 'synced';
}

export interface Setting {
  id: string;
  status_resort: 'lepas' | 'pegang';
  nama_kolektor: string;
}

export class KoperasiDB extends Dexie {
  users!: Table<User>;
  transactions!: Table<Transaction>;
  payments!: Table<Payment>;
  storting!: Table<Storting>;
  pengeluaran!: Table<Pengeluaran>;
  tunai!: Table<Tunai>;
  unit_reports!: Table<UnitReport>;
  settings!: Table<Setting>;

  constructor() {
    super('KoperasiDB');
    this.version(7).stores({
      users: '++id, email',
      transactions: 'id, tanggal_pencairan, nama_nasabah, sync_status, status_acc',
      payments: 'id, transaction_id, tanggal_pembayaran, sync_status',
      storting: 'id, date, sync_status',
      pengeluaran: 'id, tanggal, kategori, sync_status',
      tunai: 'id, tanggal, sync_status',
      unit_reports: 'id, tanggal, sync_status',
      settings: 'id'
    });
  }
}

export const db = new KoperasiDB();

