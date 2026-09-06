"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function KasMasuk() {
  const [unit, setUnit] = useState('Masjid');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    const numericAmount = Number(amount);
    const accountName = unit === 'Masjid' ? 'Kas Masjid' : 'Kas Kuttab';

    // 1. Masukkan ke tabel transactions beserta unit-nya
    const { error: trxError } = await supabase
      .from('transactions')
      .insert([{ type: 'Pemasukan', unit, description, amount: numericAmount }]);

    if (trxError) {
      alert('Gagal menyimpan transaksi: ' + trxError.message);
      setLoading(false);
      return;
    }

    // 2. Ambil saldo akun yang sesuai (Kas Masjid / Kas Kuttab)
    const { data: accData, error: accError } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', accountName)
      .limit(1);

    if (accData && accData.length > 0) {
      const currentId = accData[0].id;
      const currentBalance = Number(accData[0].balance);
      const newBalance = currentBalance + numericAmount;

      // Update saldo akun tersebut
      await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', currentId);
    }

    setLoading(false);
    setDescription('');
    setAmount('');
    setSuccessMsg(`Alhamdulillah, Kas Masuk untuk ${unit} berhasil dicatat!`);
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
          <Link href="/kas-masuk" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Kas Masuk</Link>
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
          <h1 className="text-3xl font-bold text-gray-800">Pencatatan Kas Masuk</h1>
          <p className="text-gray-500 mt-1">Catat infak, sedekah, atau pemasukan untuk Masjid atau Kuttab</p>
        </header>

        <div className="max-w-xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Unit Tujuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 text-sm bg-white"
              >
                <option value="Masjid">Kas Masjid</option>
                <option value="Kuttab">Kas Kuttab</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan / Sumber Dana</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Infak Jumat / Donasi Hamba Allah"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Nominal (Rp)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 500000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 text-white font-medium rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer disabled:bg-emerald-300 text-sm"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kas Masuk'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}