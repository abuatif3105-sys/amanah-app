"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function KasMasuk() {
  const [userEmail, setUserEmail] = useState('');
  const [sourceOption, setSourceOption] = useState('Kas Wakpro');
  const [customSource, setCustomSource] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
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

  const isKuttabOnly = userEmail === 'tu@kafmedan.com' || userEmail.includes('kuttab');

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

    // Jika akun khusus Kuttab, unit dipatok mutlak 'Kuttab'
    const unit = 'Kuttab';
    const accountName = 'Kas Kuttab';
    const finalProgram = sourceOption === 'Kas Wakpro' ? 'Kas Wakpro' : (customSource || 'Lainnya');

    // Jika sumber dari Kas Wakpro, kurangi saldo Kas Wakpro secara otomatis
    if (sourceOption === 'Kas Wakpro') {
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

      await supabase
        .from('accounts')
        .update({ balance: wakproBalance - numericAmount })
        .eq('id', wakproId);

      await supabase
        .from('transactions')
        .insert([{ 
          type: 'Pengeluaran', 
          unit: 'Wakpro', 
          program: 'Alokasi ke Kas Kuttab', 
          description: `Alokasi dana ke Kas Kuttab: ${description || 'Tanpa keterangan'}`, 
          amount: numericAmount 
        }]);
    }

    // Masukkan transaksi pemasukan ke Kas Kuttab
    const { error: trxError } = await supabase
      .from('transactions')
      .insert([{ type: 'Pemasukan', unit, program: finalProgram, description, amount: numericAmount }]);

    if (trxError) {
      setErrorMsg('Gagal menyimpan transaksi: ' + trxError.message);
      setLoading(false);
      return;
    }

    // Tambah saldo Kas Kuttab
    const { data: accData } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', accountName)
      .limit(1);

    if (accData && accData.length > 0) {
      const currentId = accData[0].id;
      const currentBalance = Number(accData[0].balance);
      const newBalance = currentBalance + numericAmount;

      await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', currentId);
    }

    setLoading(false);
    setDescription('');
    setAmount('');
    setCustomSource('');
    setSuccessMsg('Alhamdulillah, Kas Masuk Kuttab berhasil dicatat!');
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
          <Link href="/kas-masuk" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Kas Masuk</Link>
          <Link href="/kas-keluar" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Keluar</Link>
          {!isKuttabOnly && (
            <Link href="/laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Laporan</Link>
          )}
          {isKuttabOnly && (
            <Link href="/laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Laporan Kuttab</Link>
          )}
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
          <h1 className="text-3xl font-bold text-gray-800">Pencatatan Kas Masuk Kuttab</h1>
          <p className="text-gray-500 mt-1">Pencatatan dana masuk khusus untuk Kas Kuttab</p>
        </header>

        <div className="max-w-xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          {successMsg && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">{successMsg}</div>}
          {errorMsg && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Sumber Dana</label>
              <select
                value={sourceOption}
                onChange={(e) => setSourceOption(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 text-sm bg-white"
              >
                <option value="Kas Wakpro">Kas Wakpro (Mengurangi Saldo Kas Wakpro)</option>
                <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
              </select>
            </div>

            {sourceOption === 'Lainnya' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan Sumber Lainnya</label>
                <input
                  type="text"
                  required
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="Contoh: Donatur / Bantuan Operasional"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan / Catatan</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Alokasi bulanan operasional kuttab"
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
                placeholder="Contoh: 1000000"
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