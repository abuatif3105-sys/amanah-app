"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function UnitManagement() {
  const params = useParams();
  const slug = (params?.slug as string) || 'kuttab';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'masuk' | 'keluar' | 'laporan'>('masuk');
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);

  const todayDate = new Date().toISOString().split('T')[0];
  const [customDate, setCustomDate] = useState(todayDate);

  const [wakproSource, setWakproSource] = useState('Wakpro BETA');
  const [customWakpro, setCustomWakpro] = useState('');
  const [donor, setDonor] = useState('');
  
  const [kuttabSource, setKuttabSource] = useState('Kas Wakpro');
  const [customKuttabSource, setCustomKuttabSource] = useState('');

  const [masjidSource, setMasjidSource] = useState('Infaq Umum');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const [wakproCategory, setWakproCategory] = useState('Kas Kuttab');
  const [receiver, setReceiver] = useState('');

  const [kuttabCategory, setKuttabCategory] = useState('KBM');
  const [masjidCategory, setMasjidCategory] = useState('Operasional Masjid');

  const unitNameMap: { [key: string]: string } = {
    masjid: 'Kas Masjid',
    kuttab: 'Kas Kuttab',
    wakpro: 'Kas Wakpro'
  };

  const currentAccountName = unitNameMap[slug] || 'Kas Kuttab';
  const displayTitle = slug === 'masjid' ? 'Kas Masjid' : slug === 'wakpro' ? 'Kas Wakaf Produktif (Wakpro)' : 'Kas Kuttab';

  const kuttabExpenseCategories = [
    'KBM', 'KBO', 'TU', 'ATK', 'RAKER', 'PERSIAPAN KELAS', 'MOKA', 
    'SARANA PRASARANA', 'PEMBUKAAN TEMA', 'MABIT GURU', 'RAPAT', 
    'DAUROH', 'PRAMABIT', 'KEMAH', 'MABIT SANTRI'
  ];

  const wakproSources = [
    'Wakpro BETA', 'Wakpro OAE', 'Wakpro Tympano', 'Wakpro BERA', 
    'Wakpro Tumbler', 'Infak Umum', 'Wakpro Lainnya'
  ];

  const wakproCategories = [
    'Kas Kuttab', 'Operasional', 'Sarana dan Prasarana', "Ta'awun", 'Hadiah', 'Kafalah'
  ];

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const unitLabel = slug === 'masjid' ? 'Masjid' : slug === 'wakpro' ? 'Wakpro' : 'Kuttab';
    const { data: trxData } = await supabase
      .from('transactions')
      .select('*')
      .eq('unit', unitLabel)
      .order('created_at', { ascending: true });

    if (trxData) setTransactions(trxData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [slug, router]);

  const handleKasMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const numericAmount = Number(amount);
    if (numericAmount <= 0) {
      setErrorMsg('Nominal harus lebih besar dari 0.');
      setLoading(false);
      return;
    }

    const unitLabel = slug === 'masjid' ? 'Masjid' : slug === 'wakpro' ? 'Wakpro' : 'Kuttab';
    let finalProgram = 'Infaq Umum';
    let finalDesc = description;
    const transactionTimestamp = `${customDate}T12:00:00`;

    if (slug === 'wakpro') {
      finalProgram = wakproSource === 'Wakpro Lainnya' ? (customWakpro || 'Wakpro Lainnya') : wakproSource;
      finalDesc = `Donatur/Muhsinin: ${donor || 'Hamba Allah'} - ${description}`;
    } else if (slug === 'kuttab') {
      finalProgram = kuttabSource === 'Kas Wakpro' ? 'Kas Wakpro' : (customKuttabSource || 'Lainnya');
      
      if (kuttabSource === 'Kas Wakpro') {
        const { data: allWakproTrx } = await supabase.from('transactions').select('*').eq('unit', 'Wakpro');
        let currentWakproBal = 0;
        allWakproTrx?.forEach(t => {
          if (t.type === 'Pemasukan') currentWakproBal += Number(t.amount);
          else currentWakproBal -= Number(t.amount);
        });

        if (numericAmount > currentWakproBal) {
          setErrorMsg(`Gagal: Saldo Kas Wakpro tidak mencukupi (Sisa: Rp ${currentWakproBal.toLocaleString('id-ID')})!`);
          setLoading(false);
          return;
        }

        await supabase.from('transactions').insert([{
          type: 'Pengeluaran', unit: 'Wakpro', program: 'Alokasi ke Kas Kuttab',
          description: `Alokasi ke Kas Kuttab: ${description || 'Tanpa keterangan'}`, amount: numericAmount, created_at: transactionTimestamp
        }]);
      }
    } else {
      finalProgram = masjidSource;
    }

    const { error } = await supabase.from('transactions').insert([{
      type: 'Pemasukan', unit: unitLabel, program: finalProgram, description: finalDesc, amount: numericAmount, created_at: transactionTimestamp
    }]);

    if (error) {
      setErrorMsg('Gagal menyimpan: ' + error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setAmount('');
    setDescription('');
    setDonor('');
    setSuccessMsg(`Alhamdulillah, Kas Masuk ${displayTitle} berhasil dicatat!`);
    loadData();
  };

  const handleKasKeluar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const numericAmount = Number(amount);
    if (numericAmount <= 0) {
      setErrorMsg('Nominal harus lebih besar dari 0.');
      setLoading(false);
      return;
    }

    if (numericAmount > finalCalculatedBalance) {
      setErrorMsg(`Gagal: Saldo ${displayTitle} tidak mencukupi!`);
      setLoading(false);
      return;
    }

    const unitLabel = slug === 'masjid' ? 'Masjid' : slug === 'wakpro' ? 'Wakpro' : 'Kuttab';
    let finalProgram = masjidCategory;
    let finalDesc = description;
    const transactionTimestamp = `${customDate}T12:00:00`;

    if (slug === 'kuttab') {
      finalProgram = `Kategori: ${kuttabCategory}`;
    } else if (slug === 'wakpro') {
      finalProgram = wakproCategory;
      finalDesc = `Penerima: ${receiver} - ${description}`;
    }

    const { error } = await supabase.from('transactions').insert([{
      type: 'Pengeluaran', unit: unitLabel, program: finalProgram, description: finalDesc, amount: numericAmount, created_at: transactionTimestamp
    }]);

    if (error) {
      setErrorMsg('Gagal menyimpan: ' + error.message);
      setLoading(false);
      return;
    }

    if (slug === 'wakpro' && wakproCategory === 'Kas Kuttab') {
      await supabase.from('transactions').insert([{
        type: 'Pemasukan', unit: 'Kuttab', program: 'Kas Wakpro',
        description: `Alokasi dari Kas Wakpro (Penerima: ${receiver})`, amount: numericAmount, created_at: transactionTimestamp
      }]);
    }

    setLoading(false);
    setAmount('');
    setDescription('');
    setReceiver('');
    setSuccessMsg(`Kas Keluar ${displayTitle} berhasil dicatat dan saldo terpotong otomatis!`);
    loadData();
  };

  let runningBal = 0;
  const processedTransactions = transactions.map((t) => {
    const amt = Number(t.amount);
    if (t.type === 'Pemasukan') runningBal += amt;
    else runningBal -= amt;
    return { ...t, currentBalance: runningBal };
  });

  const finalCalculatedBalance = processedTransactions.length > 0 
    ? processedTransactions[processedTransactions.length - 1].currentBalance 
    : 0;

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar Responsif (Atas di HP, Kiri di Laptop/PC) */}
      <aside className="w-full md:w-64 bg-emerald-700 text-white flex flex-row md:flex-col justify-between items-center md:items-stretch p-4 md:p-6 shadow-md">
        <div className="text-xl md:text-2xl font-bold tracking-wider">AMANAH</div>
        <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 mt-0 md:mt-4 text-xs md:text-sm">
          <Link href="/" className="px-3 py-2 md:p-3 hover:bg-emerald-600 rounded-lg transition-colors text-center">← Dashboard</Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto w-full max-w-full">
        {/* Header Responsif */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manajemen {displayTitle}</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Pencatatan dan laporan keuangan terisolasi khusus unit ini.</p>
          </div>
          <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-200 self-start sm:self-auto">
            <span className="text-xs text-gray-500 block font-medium">Sisa Saldo Saat Ini:</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-700">Rp {formatRupiah(finalCalculatedBalance)}</span>
          </div>
        </header>

        {/* Tab Navigasi Responsif */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6 pb-2">
          <button onClick={() => setActiveTab('masuk')} className={`py-2 px-4 sm:px-6 font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer ${activeTab === 'masuk' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            📥 Kas Masuk
          </button>
          <button onClick={() => setActiveTab('keluar')} className={`py-2 px-4 sm:px-6 font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer ${activeTab === 'keluar' ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            📤 Kas Keluar
          </button>
          <button onClick={() => setActiveTab('laporan')} className={`py-2 px-4 sm:px-6 font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer ${activeTab === 'laporan' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            📊 Laporan & Log
          </button>
        </div>

        {successMsg && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">{successMsg}</div>}
        {errorMsg && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">{errorMsg}</div>}

        {/* FORM KAS MASUK */}
        {activeTab === 'masuk' && (
          <div className="max-w-xl bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Form Kas Masuk {displayTitle}</h3>
            <form onSubmit={handleKasMasuk} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Tanggal Transaksi</label>
                <input type="date" required value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white" />
              </div>

              {slug === 'wakpro' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Pilih Sumber Dana Wakpro</label>
                    <select value={wakproSource} onChange={(e) => setWakproSource(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm">
                      {wakproSources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {wakproSource === 'Wakpro Lainnya' && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Nama Wakpro Lainnya</label>
                      <input type="text" required value={customWakpro} onChange={(e) => setCustomWakpro(e.target.value)} placeholder="Contoh: Wakpro Toko" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Donatur / Qiyadah / Muhsinin</label>
                    <input type="text" required value={donor} onChange={(e) => setDonor(e.target.value)} placeholder="Contoh: Hamba Allah" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </>
              )}

              {slug === 'kuttab' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Sumber Dana Kas Kuttab</label>
                    <select value={kuttabSource} onChange={(e) => setKuttabSource(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm">
                      <option value="Kas Wakpro">Kas Wakpro (Mengurangi Saldo Kas Wakpro)</option>
                      <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
                    </select>
                  </div>
                  {kuttabSource === 'Lainnya' && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Keterangan Sumber Lainnya</label>
                      <input type="text" required value={customKuttabSource} onChange={(e) => setCustomKuttabSource(e.target.value)} placeholder="Contoh: Infak Umum" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  )}
                </>
              )}

              {slug === 'masjid' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Program / Sumber Masuk</label>
                  <select value={masjidSource} onChange={(e) => setMasjidSource(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm">
                    <option value="Infaq Umum">Infaq Umum</option>
                    <option value="Jumat Berkah">Jumat Berkah</option>
                    <option value="Wakaf Tunai">Wakaf Tunai</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Keterangan / Catatan Transaksi</label>
                <textarea rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tuliskan keterangan detail..." className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Jumlah Nominal (Rp)</label>
                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Contoh: 1000000" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-700 text-white font-medium rounded-lg hover:bg-emerald-800 cursor-pointer text-sm shadow-sm">
                {loading ? 'Menyimpan...' : 'Simpan Kas Masuk'}
              </button>
            </form>
          </div>
        )}

        {/* FORM KAS KELUAR */}
        {activeTab === 'keluar' && (
          <div className="max-w-xl bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Form Kas Keluar {displayTitle}</h3>
            <form onSubmit={handleKasKeluar} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Tanggal Transaksi</label>
                <input type="date" required value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white" />
              </div>

              {slug === 'wakpro' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Pilih Kategori Pengeluaran Wakpro</label>
                  <select value={wakproCategory} onChange={(e) => setWakproCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm">
                    {wakproCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {wakproCategory === 'Kas Kuttab' && <p className="text-xs text-blue-600 mt-1">💡 Otomatis menambah saldo Kas Kuttab.</p>}
                </div>
              )}

              {slug === 'kuttab' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Pilih Kategori Pengeluaran Kuttab</label>
                  <select value={kuttabCategory} onChange={(e) => setKuttabCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm">
                    {kuttabExpenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              )}

              {slug === 'masjid' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Kategori Pengeluaran Masjid</label>
                  <select value={masjidCategory} onChange={(e) => setMasjidCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm">
                    <option value="Operasional Masjid">Operasional Masjid</option>
                    <option value="Listrik & Air">Listrik & Air</option>
                    <option value="Perawatan / Kebersihan">Perawatan / Kebersihan</option>
                    <option value="Santunan / Sosial">Santunan / Sosial</option>
                  </select>
                </div>
              )}

              {slug === 'wakpro' ? (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Penerima</label>
                  <input type="text" required value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Nama penerima dana..." className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />
                </div>
              ) : null}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Keterangan / Catatan</label>
                <textarea rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rincian pengeluaran..." className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Jumlah Nominal (Rp)</label>
                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Contoh: 150000" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 cursor-pointer text-sm shadow-sm">
                {loading ? 'Menyimpan...' : 'Simpan Kas Keluar'}
              </button>
            </form>
          </div>
        )}

        {/* TAB LAPORAN & LOG */}
        {activeTab === 'laporan' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-gray-800 text-base sm:text-lg">Log Riwayat Transaksi {displayTitle}</h3>
              <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 cursor-pointer shadow-sm">
                Cetak / Unduh PDF
              </button>
            </div>
            
            {/* Tabel Responsif dengan Scroll Horisontal di HP */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold">
                    <th className="p-3 border-r border-gray-200">Hari / Tanggal</th>
                    <th className="p-3 border-r border-gray-200">Uraian / Keterangan</th>
                    <th className="p-3 border-r border-gray-200 text-right">Kredit (Masuk)</th>
                    <th className="p-3 border-r border-gray-200 text-right">Debet (Keluar)</th>
                    <th className="p-3 border-r border-gray-200 text-right">Saldo</th>
                    <th className="p-3">Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-6 text-center text-gray-500 py-12">Memuat data...</td></tr>
                  ) : processedTransactions.length > 0 ? (
                    processedTransactions.map((trx) => {
                      const dateFormatted = new Date(trx.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      });
                      return (
                        <tr key={trx.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 border-r border-gray-200 text-gray-600 whitespace-nowrap">{dateFormatted}</td>
                          <td className="p-3 border-r border-gray-200 text-gray-800 font-medium">{trx.description}</td>
                          <td className="p-3 border-r border-gray-200 text-right text-emerald-600 font-medium">
                            {trx.type === 'Pemasukan' ? formatRupiah(trx.amount) : ''}
                          </td>
                          <td className="p-3 border-r border-gray-200 text-right text-red-600 font-medium">
                            {trx.type === 'Pengeluaran' ? formatRupiah(trx.amount) : ''}
                          </td>
                          <td className="p-3 border-r border-gray-200 text-right font-bold text-gray-800">
                            {formatRupiah(trx.currentBalance)}
                          </td>
                          <td className="p-3 text-gray-700">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold whitespace-nowrap">
                              {trx.program || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={6} className="p-6 text-center text-gray-500 py-12">Belum ada catatan transaksi pada unit ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}