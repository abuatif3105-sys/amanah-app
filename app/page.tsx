"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [saldoMasjid, setSaldoMasjid] = useState(0);
  const [saldoKuttab, setSaldoKuttab] = useState(0);
  const [saldoWakpro, setSaldoWakpro] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUserEmail(session.user.email || '');
      }
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      const { data: trxData } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (trxData) setTransactions(trxData);

      const { data: accData } = await supabase
        .from('accounts')
        .select('*');

      if (accData) {
        accData.forEach((acc) => {
          if (acc.name === 'Kas Masjid') {
            setSaldoMasjid(Number(acc.balance));
          } else if (acc.name === 'Kas Kuttab') {
            setSaldoKuttab(Number(acc.balance));
          } else if (acc.name === 'Kas Wakpro') {
            setSaldoWakpro(Number(acc.balance));
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
      maximumFractionDigits: 0
    }).format(angka);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Hanya email tu@kafmedan.com yang dikhususkan untuk Kuttab saja
  const isKuttabOnly = userEmail === 'tu@kafmedan.com';

  // Filter transaksi untuk grafik Kuttab jika akun khusus Kuttab
  const kuttabTransactions = transactions.filter(t => t.unit === 'Kuttab');
  const expenseTransactions = kuttabTransactions.filter(t => t.type === 'Pengeluaran');
  const totalExpenseAll = expenseTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

  const categoryTotals: { [key: string]: number } = {};
  expenseTransactions.forEach(t => {
    const cat = t.program || 'Lainnya';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
  });

  const categoryColors: { [key: string]: string } = {
    'KBM': 'bg-blue-500',
    'KBO': 'bg-emerald-500',
    'TU': 'bg-amber-500',
    'ATK': 'bg-purple-500',
    'RAKER': 'bg-pink-500',
    'PERSIAPAN KELAS': 'bg-indigo-500',
    'MOKA': 'bg-teal-500',
    'SARANA PRASARANA': 'bg-orange-500',
    'PEMBUKAAN TEMA': 'bg-cyan-500',
    'MABIT GURU': 'bg-rose-500',
    'RAPAT': 'bg-lime-500',
    'DAUROH': 'bg-violet-500',
    'PRAMABIT': 'bg-fuchsia-500',
    'KEMAH': 'bg-sky-500',
    'MABIT SANTRI': 'bg-emerald-700'
  };

  const displayedTransactions = isKuttabOnly ? kuttabTransactions : transactions.slice(0, 5);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-emerald-700 text-white flex flex-col hidden md:flex">
        <div className="p-6 text-2xl font-bold border-b border-emerald-600">AMANAH</div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <Link href="/" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Dashboard</Link>
          <Link href="/kas-masuk" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Masuk</Link>
          <Link href="/kas-keluar" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Keluar</Link>
          <Link href="/laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">
            {isKuttabOnly ? 'Laporan Kuttab' : 'Laporan'}
          </Link>
        </nav>
        
        <div className="p-4 border-t border-emerald-600">
          <div className="mb-2 text-xs text-emerald-200 truncate" title={userEmail}>Login: {userEmail}</div>
          <button onClick={handleLogout} className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer text-center">
            Keluar (Logout)
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isKuttabOnly ? 'Dashboard Pengelola Kuttab' : 'Dashboard Keuangan Terpadu'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isKuttabOnly ? 'Ringkasan saldo, statistik, dan persentase kategori pengeluaran Kuttab' : 'Ringkasan Saldo: Masjid, Kuttab, dan Wakaf Produktif (Wakpro)'}
          </p>
        </header>

        {/* Kotak Saldo (Super Admin melihat 3 saldo, Akun Kuttab hanya melihat Kas Kuttab) */}
        {!isKuttabOnly ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-600">
              <p className="text-gray-500 text-sm font-medium">Saldo Kas Masjid</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{loading ? 'Memuat...' : formatRupiah(saldoMasjid)}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600">
              <p className="text-gray-500 text-sm font-medium">Saldo Kas Kuttab</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{loading ? 'Memuat...' : formatRupiah(saldoKuttab)}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
              <p className="text-gray-500 text-sm font-medium">Saldo Kas Wakpro</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{loading ? 'Memuat...' : formatRupiah(saldoWakpro)}</h3>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600">
              <p className="text-gray-500 text-sm font-medium">Saldo Kas Kuttab</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{loading ? 'Memuat...' : formatRupiah(saldoKuttab)}</h3>
            </div>
          </div>
        )}

        {/* Grafik Persentase Pengeluaran Khusus Akun Kuttab */}
        {isKuttabOnly && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h3 className="font-bold text-gray-800 mb-4">Persentase Pengeluaran per Kategori Kuttab</h3>
            {Object.keys(categoryTotals).length > 0 ? (
              <div className="space-y-4">
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                  {Object.entries(categoryTotals).map(([cat, amount]) => {
                    const percentage = totalExpenseAll > 0 ? (amount / totalExpenseAll) * 100 : 0;
                    const barColor = categoryColors[cat] || 'bg-gray-400';
                    return <div key={cat} style={{ width: `${percentage}%` }} className={`h-full ${barColor}`} />;
                  })}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {Object.entries(categoryTotals).map(([cat, amount]) => {
                    const percentage = totalExpenseAll > 0 ? (amount / totalExpenseAll) * 100 : 0;
                    const dotColor = categoryColors[cat] || 'bg-gray-400';
                    return (
                      <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                        <div className="flex items-center space-x-2 truncate">
                          <span className={`w-3 h-3 rounded-full ${dotColor} shrink-0`} />
                          <span className="font-medium text-gray-700 truncate">{cat}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="font-bold text-gray-800">{percentage.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">{formatRupiah(amount)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-6 text-center">Belum ada data pengeluaran untuk dianalisis.</p>
            )}
          </div>
        )}

        {/* Tabel Transaksi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">{isKuttabOnly ? 'Riwayat Transaksi Kuttab' : 'Transaksi Terbaru (Semua Unit)'}</h3>
            {!isKuttabOnly && <Link href="/laporan" className="text-sm text-emerald-600 hover:underline">Lihat Semua Laporan →</Link>}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <th className="p-4 font-medium">Tanggal</th>
                  {!isKuttabOnly && <th className="p-4 font-medium">Unit</th>}
                  <th className="p-4 font-medium">Program / Kategori</th>
                  <th className="p-4 font-medium">Keterangan</th>
                  <th className="p-4 font-medium">Jenis</th>
                  <th className="p-4 font-medium text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">Memuat data...</td>
                  </tr>
                ) : displayedTransactions.length > 0 ? (
                  displayedTransactions.map((trx) => (
                    <tr key={trx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 text-gray-600">
                        {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      {!isKuttabOnly && (
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            trx.unit === 'Kuttab' ? 'bg-blue-50 text-blue-700' : 
                            trx.unit === 'Wakpro' ? 'bg-amber-50 text-amber-700' : 
                            'bg-emerald-50 text-emerald-700'
                          }`}>
                            {trx.unit || 'Masjid'}
                          </span>
                        </td>
                      )}
                      <td className="p-4 font-semibold text-gray-800">{trx.program || '-'}</td>
                      <td className="p-4 text-gray-600">{trx.description}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${trx.type === 'Pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {trx.type}
                        </span>
                      </td>
                      <td className={`p-4 font-bold text-right ${trx.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trx.type === 'Pemasukan' ? '+' : '-'} {formatRupiah(trx.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">Belum ada transaksi.</td>
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