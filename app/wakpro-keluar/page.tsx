"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function WakproKeluar() {
  const [category, setCategory] = useState('Operasional');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const wakproCategories = [
    'Kas Kuttab',
    'Operasional',
    'Sarana dan Prasarana',
    "Ta'awun",
    'Hadiah',
    'Kafalah'
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

    // Cek saldo Kas Wakpro terlebih dahulu
    const { data: wakproAcc, error: wakproErr } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', 'Kas Wakpro')
      .limit(1);

    if (wakproErr || !wakproAcc || wakproAcc.length === 0) {
      setErrorMsg('Gagal memeriksa saldo Kas Wakpro.');
      setLoading(false);
      return;
    }

    const wakproId = wakproAcc[0].id;
    const wakproBalance = Number(wakproAcc[0].balance);

    if (numericAmount > wakproBalance) {
      setErrorMsg(`Gagal: Saldo Kas Wakpro tidak mencukupi (Sisa: Rp ${wakproBalance.toLocaleString('id-ID')})!`);
      setLoading(false);
      return;
    }

    const description = `Penerima: ${receiver} (${category})`;

    // 1. Catat pengeluaran di Kas Wakpro
    const { error: trxError } = await supabase
      .from('transactions')
      .insert([{ 
        type: 'Pengeluaran', 
        unit: 'Wakpro', 
        program: category, 
        description, 
        amount: numericAmount 
      }]);

    if (trxError) {
      setErrorMsg('Gagal menyimpan transaksi: ' + trxError.message);
      setLoading(false);
      return;
    }

    // 2. Kurangi saldo Kas Wakpro
    await supabase
      .from('accounts')
      .update({ balance: wakproBalance - numericAmount })
      .eq('id', wakproId);

    // 3. JIKA KATEGORI PILIH "Kas Kuttab", Otomatis tambahkan saldo & catat pemasukan di Kas Kuttab!
    if (category === 'Kas Kuttab') {
      const { data: kuttabAcc } = await supabase
        .from('accounts')
        .select('*')
        .eq('name', 'Kas Kuttab')
        .limit(1);

      if (kuttabAcc && kuttabAcc.length > 0) {
        const kuttabId = kuttabAcc[0].id;
        const kuttabBalance = Number(kuttabAcc[0].balance);

        await supabase
          .from('accounts')
          .update({ balance: kuttabBalance + numericAmount })
          .eq('id', kuttabId);

        await supabase
          .from('transactions')
          .insert([{ 
            type: 'Pemasukan', 
            unit: 'Kuttab', 
            program: 'Kas Wakpro', 
            description: `Alokasi dana dari Kas Wakpro (Penerima: ${receiver})`, 
            amount: numericAmount 
          }]);
      }
    }

    setLoading(false);
    setReceiver('');
    setAmount('');
    setSuccessMsg('Kas Keluar Wakpro berhasil dicatat dan saldo terpotong otomatis!');
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
          <Link href="/wakpro-keluar" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Kas Keluar Wakpro</Link>
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
          <h1 className="text-3xl font-bold text-gray-800">Kas Keluar Wakpro</h1>
          <p className="text-gray-500 mt-1">Catat penggunaan dana atau alokasi dari Kas Wakpro</p>
        </header>

        <div className="max-w-xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          {successMsg && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">{successMsg}</div>}
          {errorMsg && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kategori Pengeluaran Wakpro</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 text-sm bg-white"
              >
                {wakproCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {category === 'Kas Kuttab' && (
                <p className="text-xs text-blue-600 mt-1">💡 Memilih ini akan otomatis menambah Saldo Kas Kuttab.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Penerima</label>
              <input
                type="text"
                required
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="Contoh: Pengurus Kuttab / Toko Bangunan / Ust. Fulan"
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
              className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:bg-red-300 text-sm"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kas Keluar Wakpro'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}