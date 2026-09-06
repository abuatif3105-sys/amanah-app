"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [saldoMasjid, setSaldoMasjid] = useState(0);
  const [saldoKuttab, setSaldoKuttab] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Cek apakah sudah login
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      // Ambil transaksi terbaru
      const { data: trxData } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (trxData) setTransactions(trxData);

      // Ambil saldo dari tabel accounts (Kas Masjid & Kas Kuttab)
      const { data: accData } = await supabase
        .from('accounts')
        .select('*');

      if (accData) {
        accData.forEach((acc) => {
          if (acc.name === 'Kas Masjid') {
            setSaldoMasjid(Number(acc.balance));
          } else if (acc.name === 'Kas Kuttab') {
            setSaldoKuttab(Number(acc.balance));
          }
        });
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigasi */}
      <aside className="w-64 bg-emerald-700 text-white flex flex-col hidden md:flex">
        <div className="p-6 text-2xl font-bold border-b border-emerald-600">AMANAH</div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <Link href="/" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Dashboard</Link>
          <Link href="/kas-masuk" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Masuk</Link>
          <Link href="/kas-keluar" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Keluar</Link>
          <Link href="/laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Laporan</Link>
        </nav>
        
        {/* Tombol Logout */}
        <div className="p-4 border-t border-emerald-600">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer text-center"
          >
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Ringkasan Keuangan Terpisah Masjid & Kuttab Al-Fatih</p>
        </header>

        {/* Kartu Ringkasan Saldo Terpisah */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-600">
            <p className="text-gray-500 text-sm font-medium">Saldo Kas Masjid</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-2">
              {loading ? 'Memuat...' : formatRupiah(saldoMasjid)}
            </h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600">
            <p className="text-gray-500 text-sm font-medium">Saldo Kas Kuttab</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-2">
              {loading ? 'Memuat...' : formatRupiah(saldoKuttab)}
            </h3>
          </div>
        </div>

        {/* Tabel Transaksi Terbaru */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Transaksi Terbaru</h3>
            <Link href="/laporan" className="text-sm text-emerald-600 hover:underline">Lihat Semua Laporan →</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Unit</th>
                  <th className="p-4 font-medium">Keterangan</th>
                  <th className="p-4 font-medium">Jenis</th>
                  <th className="p-4 font-medium text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">Memuat data...</td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${trx.unit === 'Kuttab' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {trx.unit || 'Masjid'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-800 font-medium">{trx.description}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${trx.type === 'Pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {trx.type}
                        </span>
                      </td>
                      <td className={`p-4 text-sm font-bold text-right ${trx.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trx.type === 'Pemasukan' ? '+' : '-'} {formatRupiah(trx.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">Belum ada transaksi.</td>
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