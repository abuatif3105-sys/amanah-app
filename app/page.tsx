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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar Responsif */}
      <aside className="w-full md:w-64 bg-emerald-700 text-white flex flex-row md:flex-col justify-between items-center md:items-stretch p-4 md:p-6 shadow-md">
        <div className="text-xl md:text-2xl font-bold tracking-wider">AMANAH</div>
        <div className="flex md:flex-col items-center gap-2">
          <span className="hidden md:block text-xs text-emerald-200 truncate max-w-[200px]" title={userEmail}>{userEmail}</span>
          <button onClick={handleLogout} className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer text-center">
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto w-full max-w-full">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard Keuangan Terpadu</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Silakan pilih salah satu kartu unit di bawah ini untuk mengelola pencatatan.</p>
        </header>

        {/* 3 Tombol Kartu Saldo Utama (Grid Responsif) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          
          {!isKuttabOnly && (
            <div 
              onClick={() => router.push('/unit/masjid')}
              className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 border-l-8 border-l-emerald-600 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Unit Masjid</span>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Saldo Kas Masjid</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 mt-1">
                {loading ? 'Memuat...' : formatRupiah(saldoMasjid)}
              </h3>
              <p className="text-xs text-emerald-700 mt-3 font-medium">Kelola Kas & Laporan Masjid</p>
            </div>
          )}

          <div 
            onClick={() => router.push('/unit/kuttab')}
            className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 border-l-8 border-l-blue-600 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Unit Kuttab</span>
              <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Saldo Kas Kuttab</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 mt-1">
              {loading ? 'Memuat...' : formatRupiah(saldoKuttab)}
            </h3>
            <p className="text-xs text-blue-700 mt-3 font-medium">Kelola Kas & Laporan Kuttab</p>
          </div>

          {!isKuttabOnly && (
            <div 
              onClick={() => router.push('/unit/wakpro')}
              className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 border-l-8 border-l-amber-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">Unit Wakpro</span>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Saldo Kas Wakpro</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 mt-1">
                {loading ? 'Memuat...' : formatRupiah(saldoWakpro)}
              </h3>
              <p className="text-xs text-amber-700 mt-3 font-medium">Kelola Kas & Laporan Wakpro</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}