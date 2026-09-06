"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function WakproLaporan() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      // Hanya mengambil transaksi khusus unit 'Wakpro'
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('unit', 'Wakpro')
        .order('created_at', { ascending: true });
      
      if (data) setTransactions(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  let totalKredit = 0;
  let totalDebet = 0;
  let runningBalance = 0;

  const processedTransactions = transactions.map((trx) => {
    const amount = Number(trx.amount);
    if (trx.type === 'Pemasukan') {
      totalKredit += amount;
      runningBalance += amount;
    } else {
      totalDebet += amount;
      runningBalance -= amount;
    }
    return {
      ...trx,
      currentBalance: runningBalance
    };
  });

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0
    }).format(angka);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-emerald-700 text-white flex flex-col hidden md:flex">
        <div className="p-6 text-2xl font-bold border-b border-emerald-600">AMANAH</div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <Link href="/" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Dashboard</Link>
          <Link href="/wakpro-masuk" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Masuk Wakpro</Link>
          <Link href="/wakpro-keluar" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Keluar Wakpro</Link>
          <Link href="/wakpro-laporan" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Laporan Wakpro</Link>
          <Link href="/laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Laporan Terpadu</Link>
        </nav>
        
        <div className="p-4 border-t border-emerald-600">
          <button onClick={handleLogout} className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer text-center">
            Keluar (Logout)
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Laporan Kas Wakpro</h1>
            <p className="text-gray-500 mt-1">Log riwayat transaksi, pemasukan, pengeluaran, dan saldo berjalan Kas Wakaf Produktif</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button 
              onClick={() => window.print()} 
              className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cetak / Unduh PDF
            </button>
          </div>
        </header>

        {/* Kartu Ringkasan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium">Total Kredit (Masuk)</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">Rp {formatRupiah(totalKredit)}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium">Total Debet (Keluar)</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">Rp {formatRupiah(totalDebet)}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium">Saldo Akhir Wakpro</p>
            <h3 className={`text-2xl font-bold mt-1 ${runningBalance < 0 ? 'text-red-600' : 'text-gray-800'}`}>
              Rp {formatRupiah(runningBalance)}
            </h3>
          </div>
        </div>

        {/* Tabel Log Transaksi Wakpro */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Log Transaksi Kas Wakpro</h3>
            <span className="text-xs text-gray-400">Total: {processedTransactions.length} catatan</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold">
                  <th className="p-3.5 border-r border-gray-200">Hari / Tanggal</th>
                  <th className="p-3.5 border-r border-gray-200">Keterangan / Uraian</th>
                  <th className="p-3.5 border-r border-gray-200 text-right">Kredit (Masuk)</th>
                  <th className="p-3.5 border-r border-gray-200 text-right">Debet (Keluar)</th>
                  <th className="p-3.5 border-r border-gray-200 text-right">Saldo</th>
                  <th className="p-3.5">Kategori / Sumber</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500 py-12">Memuat data laporan...</td>
                  </tr>
                ) : processedTransactions.length > 0 ? (
                  processedTransactions.map((trx) => {
                    const dateFormatted = new Date(trx.created_at).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });

                    return (
                      <tr key={trx.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3.5 border-r border-gray-200 text-gray-600 whitespace-nowrap">{dateFormatted}</td>
                        <td className="p-3.5 border-r border-gray-200 text-gray-800 font-medium">{trx.description}</td>
                        <td className="p-3.5 border-r border-gray-200 text-right text-emerald-600 font-medium">
                          {trx.type === 'Pemasukan' ? formatRupiah(trx.amount) : ''}
                        </td>
                        <td className="p-3.5 border-r border-gray-200 text-right text-red-600 font-medium">
                          {trx.type === 'Pengeluaran' ? formatRupiah(trx.amount) : ''}
                        </td>
                        <td className="p-3.5 border-r border-gray-200 text-right font-bold text-gray-800">
                          {formatRupiah(trx.currentBalance)}
                        </td>
                        <td className="p-3.5 text-gray-700">
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-semibold">
                            {trx.program || 'Wakpro'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500 py-12">Belum ada catatan transaksi Kas Wakpro.</td>
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