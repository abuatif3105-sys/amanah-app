"use client"; 

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'; 

export default function KasKeluar() {
  const [keterangan, setKeterangan] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [loading, setLoading] = useState(false);

  const simpanKasKeluar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: kasLama, error: errorCari } = await supabase
        .from('accounts')
        .select('balance, id')
        .eq('name', 'Kas Utama Masjid')
        .single();

      if (errorCari) {
        alert("Gagal mencari akun kas: " + errorCari.message);
        setLoading(false);
        return;
      }

      const jumlahKeluar = Number(jumlah);

      if (Number(kasLama.balance) < jumlahKeluar) {
        alert("Maaf, saldo kas masjid tidak mencukupi untuk pengeluaran ini!");
        setLoading(false);
        return;
      }

      const saldoBaru = Number(kasLama.balance) - jumlahKeluar;

      const { error: errorUpdate } = await supabase
        .from('accounts')
        .update({ balance: saldoBaru })
        .eq('id', kasLama.id);

      if (errorUpdate) {
        alert("Gagal memperbarui saldo: " + errorUpdate.message);
        setLoading(false);
        return;
      }

      const { error: errorRiwayat } = await supabase
        .from('transactions')
        .insert([
          {
            description: keterangan,
            amount: jumlahKeluar,
            type: 'Pengeluaran'
          }
        ]);

      if (errorRiwayat) {
        alert("Gagal menyimpan riwayat: " + errorRiwayat.message);
        setLoading(false);
        return;
      }

      alert(`Pengeluaran "${keterangan}" sebesar Rp ${jumlah} berhasil dicatat.`);
      setKeterangan('');
      setJumlah('');

    } catch (error: any) {
      alert("Terjadi kesalahan sistem: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-emerald-700 text-white flex flex-col hidden md:flex">
        <div className="p-6 text-2xl font-bold border-b border-emerald-600">AMANAH</div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <Link href="/" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Dashboard</Link>
          <Link href="/kas-masuk" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Masuk</Link>
          <Link href="/kas-keluar" className="block p-3 bg-emerald-800 rounded-lg font-medium transition-colors">Kas Keluar</Link>
          <Link href="/laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Laporan</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Catat Kas Keluar</h1>
          <p className="text-gray-500 mt-1">Masukkan data pengeluaran/operasional masjid</p>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
          <form onSubmit={simpanKasKeluar}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan (Keperluan)</label>
              <input 
                type="text" required
                placeholder="Contoh: Pembayaran Listrik & Air"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-800"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah (Rp)</label>
              <input 
                type="number" required min="1"
                placeholder="Contoh: 200000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-800"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button 
                type="submit" disabled={loading}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
              </button>
              <Link href="/" className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">
                Kembali ke Dashboard
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}