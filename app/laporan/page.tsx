"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LaporanKeuangan() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setTransactions(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredTransactions = transactions.filter((trx) => {
    if (filterUnit === 'Semua') return true;
    return (trx.unit || 'Masjid') === filterUnit;
  });

  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  filteredTransactions.forEach((trx) => {
    if (trx.type === 'Pemasukan') {
      totalPemasukan += Number(trx.amount);
    } else if (trx.type === 'Pengeluaran') {
      totalPengeluaran += Number(trx.amount);
    }
  });

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
          <Link href="/" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Dashboard</Link>
          <Link href="/kas-masuk" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Masuk</Link>
          <Link href="/kas-keluar" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Keluar</Link>
          <Link href="/laporan" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Laporan</Link>
        </nav>
        
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
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Laporan Keuangan Terpadu</h1>
            <p className="text-gray-500 mt-1">Rekapitulasi riwayat transaksi Masjid, Kuttab, dan Wakpro</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Unit</option>
              <option value="Masjid">Kas Masjid</option>
              <option value="Kuttab">Kas Kuttab</option>
              <option value="Wakpro">Kas Wakpro</option>
            </select>

            <button 
              onClick={() => window.print()} 
              className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cetak / Unduh PDF
            </button>
          </div>
        </header>

        {/* Kartu Ringkasan Laporan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Akumulasi Pemasukan ({filterUnit})</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatRupiah(totalPemasukan)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 text-xl">📥</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Akumulasi Pengeluaran ({filterUnit})</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{formatRupiah(totalPengeluaran)}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-full text-red-600 text-xl">📤</div>
          </div>
        </div>

        {/* Tabel Riwayat Transaksi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Riwayat Transaksi & Program ({filterUnit})</h3>
            <span className="text-xs text-gray-400">Total: {filteredTransactions.length} catatan</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Unit</th>
                  <th className="p-4 font-medium">Program / Tujuan</th>
                  <th className="p-4 font-medium">Keterangan</th>
                  <th className="p-4 font-medium">Jenis</th>
                  <th className="p-4 font-medium text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500 py-12">
                      Memuat laporan...
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((trx) => (
                    <tr key={trx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          trx.unit === 'Kuttab' ? 'bg-blue-50 text-blue-700' : 
                          trx.unit === 'Wakpro' ? 'bg-amber-50 text-amber-700' : 
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {trx.unit || 'Masjid'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-800">
                        {trx.program || 'Infaq Umum'}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{trx.description || '-'}</td>
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
                    <td colSpan={6} className="p-6 text-center text-gray-500 py-12">
                      Belum ada laporan transaksi untuk unit ini.
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