"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function WakproMasuk() {
  const [sourceOption, setSourceOption] = useState('Wakpro BETA');
  const [customWakpro, setCustomWakpro] = useState('');
  const [donor, setDonor] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const wakproSources = [
    'Wakpro BETA',
    'Wakpro OAE',
    'Wakpro Tympano',
    'Wakpro BERA',
    'Wakpro Tumbler',
    'Infak Umum',
    'Wakpro Lainnya'
  ];

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const numericAmount = Number(amount);
    if (numericAmount <= 0) {
      setErrorMsg('Jumlah nominal harus lebih besar dari 0.');
      setLoading(false);
      return;
    }

    const finalSource = sourceOption === 'Wakpro Lainnya' ? (customWakpro || 'Wakpro Lainnya') : sourceOption;
    const description = `Donatur/Muhsinin: ${donor || 'Hamba Allah'} (Sumber: ${finalSource})`;

    // 1. Simpan ke tabel transactions dengan unit 'Wakpro'
    const { error: trxError } = await supabase
      .from('transactions')
      .insert([{ 
        type: 'Pemasukan', 
        unit: 'Wakpro', 
        program: finalSource, 
        description, 
        amount: numericAmount 
      }]);

    if (trxError) {
      setErrorMsg('Gagal menyimpan transaksi: ' + trxError.message);
      setLoading(false);
      return;
    }

    // 2. Tambah saldo di Kas Wakpro
    const { data: accData } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', 'Kas Wakpro')
      .limit(1);

    if (accData && accData.length > 0) {
      const currentId = accData[0].id;
      const currentBalance = Number(accData[0].balance);
      await supabase
        .from('accounts')
        .update({ balance: currentBalance + numericAmount })
        .eq('id', currentId);
    }

    setLoading(false);
    setDonor('');
    setAmount('');
    setCustomSource('');
    setSuccessMsg('Alhamdulillah, Kas Masuk Wakpro berhasil dicatat dan saldo bertambah!');
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
          <Link href="/wakpro-masuk" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Kas Masuk Wakpro</Link>
          <Link href="/wakpro-keluar" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Keluar Wakpro</Link>
          <Link href="/wakpro-laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Laporan Wakpro</Link>
          <Link href="/laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Laporan Terpadu</Link>
        </nav>
        
        <div className="p-4 border-t border-emerald-600">
          <button onClick={handleLogout} className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer text-center">
            Keluar (Logout)
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Kas Masuk Wakpro</h1>
          <p className="text-gray-500 mt-1">Pencatatan dana pemasukan khusus Wakaf Produktif</p>
        </header>

        <div className="max-w-xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          {successMsg && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">{successMsg}</div>}
          {errorMsg && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Sumber Dana Wakpro</label>
              <select
                value={sourceOption}
                onChange={(e) => setSourceOption(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 text-sm bg-white"
              >
                {wakproSources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            {sourceOption === 'Wakpro Lainnya' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tulis Nama Wakpro Lainnya</label>
                <input
                  type="text"
                  required
                  value={customWakpro}
                  onChange={(e) => setCustomWakpro(e.target.value)}
                  placeholder="Contoh: Wakpro Kebun / Wakpro Toko"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Donatur / Qiyadah / Muhsinin</label>
              <input
                type="text"
                required
                value={donor}
                onChange={(e) => setDonor(e.target.value)}
                placeholder="Contoh: Hamba Allah / Bapak Ahmad"
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
                placeholder="Contoh: 1500000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 text-white font-medium rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer disabled:bg-emerald-300 text-sm"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kas Masuk Wakpro'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}