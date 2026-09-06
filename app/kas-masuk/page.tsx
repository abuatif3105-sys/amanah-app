"use client"; 

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'; 

export default function KasMasuk() {
  const [keterangan, setKeterangan] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [loading, setLoading] = useState(false);

  const simpanTransaksi = async (e: React.FormEvent) => {
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

      const saldoBaru = Number(kasLama.balance) + Number(jumlah);

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
            amount: Number(jumlah),
            type: 'Pemasukan'
          }
        ]);

      if (errorRiwayat) {
        alert("Gagal menyimpan riwayat: " + errorRiwayat.message);
        setLoading(false);
        return;
      }

      alert(`Alhamdulillah! Transaksi "${keterangan}" sebesar Rp ${jumlah} berhasil disimpan.`);
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
          <Link href="/kas-masuk" className="block p-3 bg-emerald-800 rounded-lg font-medium">Kas Masuk</Link>
          <Link href="/kas-keluar" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Kas Keluar</Link>
          <Link href="/laporan" className="block p-3 hover:bg-emerald-600 rounded-lg transition-colors">Laporan</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Catat Kas Masuk</h1>
          <p className="text-gray-500 mt-1">Masukkan data penerimaan dana masjid</p>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
          <form onSubmit={simpanTransaksi}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan (Sumber Dana)</label>
              <input 
                type="text" required
                placeholder="Contoh: Infaq Jumat"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-800"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah (Rp)</label>
              <input 
                type="number" required min="1"
                placeholder="Contoh: 50000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-800"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button 
                type="submit" disabled={loading}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
              >
                {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
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