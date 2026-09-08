"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  
  // Menyiapkan 4 penampung saldo
  const [balances, setBalances] = useState({
    masjid: 0,
    kuttab: 0,
    wakpro: 0,
    bilistiwa: 0, 
  });

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      // Cek apakah user sudah login
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserEmail(session.user.email || '');

      // Ambil seluruh transaksi
      const { data: trxData, error } = await supabase
        .from('transactions')
        .select('unit, type, amount');

      if (!error && trxData) {
        let mBal = 0, kBal = 0, wBal = 0, bBal = 0;
        
        trxData.forEach(t => {
          const amt = Number(t.amount);
          if (t.unit === 'Masjid') {
            t.type === 'Pemasukan' ? mBal += amt : mBal -= amt;
          } else if (t.unit === 'Kuttab') {
            t.type === 'Pemasukan' ? kBal += amt : kBal -= amt;
          } else if (t.unit === 'Wakpro') {
            t.type === 'Pemasukan' ? wBal += amt : wBal -= amt;
          } else if (t.unit === 'Bilistiwa') {
            t.type === 'Pemasukan' ? bBal += amt : bBal -= amt;
          }
        });
        
        setBalances({ masjid: mBal, kuttab: kBal, wakpro: wBal, bilistiwa: bBal });
      }
      setLoading(false);
    };

    checkUserAndFetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(angka);
  };

  if (loading) {
      return (
          <div className="flex min-h-screen items-center justify-center font-bold text-emerald-700 bg-gray-50">
              Memuat Dashboard...
          </div>
      );
  }

  // Variabel Penanda Akun Pakde
  const isPakde = userEmail === 'pakde@kafmedan.com';

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-emerald-700 text-white flex flex-col justify-between p-6 shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold tracking-widest mb-8">AMANAH</h1>
        </div>
        <div className="mt-10 md:mt-0 border-t border-emerald-600 pt-4">
          <p className="text-xs mb-3 truncate opacity-80" title={userEmail}>{userEmail}</p>
          <button 
              onClick={handleLogout} 
              className="w-full px-4 py-2 bg-emerald-800 hover:bg-emerald-900 rounded-lg text-sm font-bold transition-colors cursor-pointer text-left"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-8 border-b border-gray-200 pb-6">
          <h2 className="text-3xl font-bold text-gray-800">Dashboard Keuangan Terpadu</h2>
          <p className="text-gray-500 mt-2">Silakan pilih salah satu kartu unit di bawah ini untuk mengelola pencatatan.</p>
        </header>

        {/* 4 Kolom Grid (Otomatis menyesuaikan jika ada kartu yang disembunyikan) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Kartu 1: Masjid (Semua Bisa Lihat) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500 flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Unit Masjid</span>
              <p className="text-gray-500 text-sm mt-4 font-medium">Saldo Kas Masjid</p>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mt-1 truncate" title={`Rp ${formatRupiah(balances.masjid)}`}>
                  Rp {formatRupiah(balances.masjid)}
              </h3>
            </div>
            <Link href="/unit/masjid" className="mt-8 text-emerald-600 font-bold text-sm flex items-center justify-between group-hover:text-emerald-700">
              Kelola Kas & Laporan <span>→</span>
            </Link>
          </div>

          {/* Kartu 2: Kuttab (Pakde TIDAK BISA Lihat) */}
          {!isPakde && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500 flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Unit Kuttab</span>
                <p className="text-gray-500 text-sm mt-4 font-medium">Saldo Kas Kuttab</p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mt-1 truncate" title={`Rp ${formatRupiah(balances.kuttab)}`}>
                    Rp {formatRupiah(balances.kuttab)}
                </h3>
              </div>
              <Link href="/unit/kuttab" className="mt-8 text-blue-600 font-bold text-sm flex items-center justify-between group-hover:text-blue-700">
                Kelola Kas & Laporan <span>→</span>
              </Link>
            </div>
          )}

          {/* Kartu 3: Wakpro (Pakde TIDAK BISA Lihat) */}
          {!isPakde && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500 flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Unit Wakpro</span>
                <p className="text-gray-500 text-sm mt-4 font-medium">Saldo Kas Wakpro</p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mt-1 truncate" title={`Rp ${formatRupiah(balances.wakpro)}`}>
                    Rp {formatRupiah(balances.wakpro)}
                </h3>
              </div>
              <Link href="/unit/wakpro" className="mt-8 text-amber-600 font-bold text-sm flex items-center justify-between group-hover:text-amber-700">
                Kelola Kas & Laporan <span>→</span>
              </Link>
            </div>
          )}

          {/* Kartu 4: Bilistiwa (Semua Bisa Lihat) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500 flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Unit Bilistiwa</span>
              <p className="text-gray-500 text-sm mt-4 font-medium">Kas Operasional</p>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mt-1 truncate" title={`Rp ${formatRupiah(balances.bilistiwa)}`}>
                  Rp {formatRupiah(balances.bilistiwa)}
              </h3>
            </div>
            <Link href="/unit/bilistiwa" className="mt-8 text-purple-600 font-bold text-sm flex items-center justify-between group-hover:text-purple-700">
              Kelola Kas & Laporan <span>→</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}