import React from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // 1. Mengambil total saldo
  const { data: accounts } = await supabase.from('accounts').select('balance');
  let totalSaldo = 0;
  if (accounts) {
    totalSaldo = accounts.reduce((jumlah, kas) => jumlah + Number(kas.balance), 0);
  }
  const saldoRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(totalSaldo);

  // 2. Mengambil 5 transaksi terbaru
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigasi */}
      <aside className="w-64 bg-emerald-700 text-white flex flex-col hidden md:flex">
        <div className="p-6 text-2xl font-bold border-b border-emerald-600">
          AMANAH
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <Link href="/" className="block p-3 bg-emerald-800 rounded-lg font-medium">Dashboard</Link>
          <Link href="/kas-masuk" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Masuk</Link>
          <Link href="/kas-keluar" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Keluar</Link>
          <Link href="/laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Laporan</Link>
        </nav>
        <div className="p-4 border-t border-emerald-600 text-xs text-emerald-200">
          Login sebagai: Bendahara
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Ringkasan Keuangan Masjid & Kuttab Al-Fatih</p>
        </header>

        {/* Kartu Ringkasan Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Total Saldo Saat Ini</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{saldoRupiah}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Pemasukan Bulan Ini</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-2">Live Sistem</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Pengeluaran Bulan Ini</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">Live Sistem</p>
          </div>
        </div>

        {/* Tabel Transaksi Terbaru */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Transaksi Terbaru</h3>
            <Link href="/laporan" className="text-xs font-medium text-emerald-600 hover:underline">
              Lihat Semua Laporan &rarr;
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Keterangan</th>
                  <th className="p-4 font-medium">Jenis</th>
                  <th className="p-4 font-medium text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {transactions && transactions.length > 0 ? (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-sm text-gray-800 font-medium">{trx.description}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${trx.type === 'Pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {trx.type}
                        </span>
                      </td>
                      <td className={`p-4 text-sm font-bold text-right ${trx.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trx.type === 'Pemasukan' ? '+' : '-'} {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(trx.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500 py-12">
                      Belum ada transaksi di database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}