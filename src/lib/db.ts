import Dexie, { type Table } from 'dexie';

export interface User {
  id?: number;
  email: string;
  password?: string;
  role: 'pimpinan' | 'kolektor';
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

export class KoperasiDB extends Dexie {
  users!: Table<User>;
  transactions!: Table<Transaction>;
  payments!: Table<Payment>;
  storting!: Table<Storting>;

  constructor() {
    super('KoperasiDB');
    this.version(1).stores({
      users: '++id, email',
      transactions: 'id, tanggal_pencairan, nama_nasabah, sync_status',
      payments: 'id, transaction_id, tanggal_pembayaran, sync_status',
      storting: 'id, date, sync_status'
    });
  }
}

export const db = new KoperasiDB();

