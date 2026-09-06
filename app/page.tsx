"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState('');
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
    async function fetchBalances() {
      // Ambil seluruh transaksi untuk menghitung saldo secara real-time dan akurat
      const { data: trxData } = await supabase
        .from('transactions')
        .select('*');

      let mTotal = 0;
      let kTotal = 0;
      let wTotal = 0;

      if (trxData) {
        trxData.forEach((trx) => {
          const amt = Number(trx.amount);
          const unit = trx.unit;
          const type = trx.type;

          if (unit === 'Masjid') {
            if (type === 'Pemasukan') mTotal += amt;
            else mTotal -= amt;
          } else if (unit === 'Kuttab') {
            if (type === 'Pemasukan') kTotal += amt;
            else kTotal -= amt;
          } else if (unit === 'Wakpro') {
            if (type === 'Pemasukan') wTotal += amt;
            else wTotal -= amt;
          }
        });
      }

      setSaldoMasjid(mTotal);
      setSaldoKuttab(kTotal);
      setSaldoWakpro(wTotal);
      setLoading(false);
    }
    fetchBalances();
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

  const isKuttabOnly = userEmail === 'tu@kafmedan.com';

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-emerald-700 text-white flex flex-col hidden md:flex">
        <div className="p-6 text-2xl font-bold border-b border-emerald-600">AMANAH</div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <Link href="/" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Dashboard Utama</Link>
        </nav>
        <div className="p-4 border-t border-emerald-600">
          <div className="mb-2 text-xs text-emerald-200 truncate" title={userEmail}>Login: {userEmail}</div>
          <button onClick={handleLogout} className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer text-center">
            Keluar (Logout)
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Keuangan Terpadu</h1>
          <p className="text-gray-500 mt-1">Silakan klik salah satu kartu unit di bawah ini untuk mengelola pencatatan dan laporan spesifik.</p>
        </header>

        {/* 3 Tombol Kartu Saldo Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {!isKuttabOnly && (
            <div 
              onClick={() => router.push('/unit/masjid')}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 border-l-8 border-l-emerald-600 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Unit Masjid</span>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Saldo Kas Masjid</p>
              <h3 className="text-2xl font-extrabold text-gray-800 mt-1">
                {loading ? 'Memuat...' : formatRupiah(saldoMasjid)}
              </h3>
              <p className="text-xs text-emerald-700 mt-4 font-medium">Klik untuk kelola Masuk, Keluar & Laporan Masjid</p>
            </div>
          )}

          <div 
            onClick={() => router.push('/unit/kuttab')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 border-l-8 border-l-blue-600 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Unit Kuttab</span>
              <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Saldo Kas Kuttab</p>
            <h3 className="text-2xl font-extrabold text-gray-800 mt-1">
              {loading ? 'Memuat...' : formatRupiah(saldoKuttab)}
            </h3>
            <p className="text-xs text-blue-700 mt-4 font-medium">Klik untuk kelola Masuk, Keluar & Laporan Kuttab</p>
          </div>

          {!isKuttabOnly && (
            <div 
              onClick={() => router.push('/unit/wakpro')}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 border-l-8 border-l-amber-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">Unit Wakpro</span>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Saldo Kas Wakpro</p>
              <h3 className="text-2xl font-extrabold text-gray-800 mt-1">
                {loading ? 'Memuat...' : formatRupiah(saldoWakpro)}
              </h3>
              <p className="text-xs text-amber-700 mt-4 font-medium">Klik untuk kelola Masuk, Keluar & Laporan Wakpro</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}