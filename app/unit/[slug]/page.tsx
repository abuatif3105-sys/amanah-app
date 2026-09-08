"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function UnitManagement() {
  const params = useParams();
  const slug = (params?.slug as string) || 'kuttab';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'masuk' | 'keluar' | 'laporan'>('laporan');
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);

  // State Auth & Role
  const [userRole, setUserRole] = useState('');
  const [tuPin, setTuPin] = useState('123456');

  // Modal PIN & Edit/Delete
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [actionType, setActionType] = useState<'edit' | 'delete' | null>(null);
  const [selectedTrx, setSelectedTrx] = useState<any>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ 
      amount: '', description: '', program: '', created_at: '', type: '' 
  });

  // State Filter Laporan
  const [filterMode, setFilterMode] = useState<'semua' | 'hari' | 'bulan' | 'tahun' | 'rentang'>('semua');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State Input Form
  const todayDate = new Date().toISOString().split('T')[0];
  const [customDate, setCustomDate] = useState(todayDate);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiver, setReceiver] = useState('');
  
  // Kuttab
  const [kuttabSource, setKuttabSource] = useState('Kas Wakpro');
  const [customKuttabSource, setCustomKuttabSource] = useState('');
  const [kuttabCategory, setKuttabCategory] = useState('KONSUMSI');
  
  // Wakpro
  const [wakproSource, setWakproSource] = useState('Wakpro BETA');
  const [customWakpro, setCustomWakpro] = useState('');
  const [donor, setDonor] = useState('');
  const [wakproCategory, setWakproCategory] = useState('Kas Kuttab');

  // Masjid
  const [masjidSource, setMasjidSource] = useState('Infaq Umum');
  const [masjidCategory, setMasjidCategory] = useState('Operasional Masjid');

  // Bilistiwa (BARU)
  const [bilistiwaSource, setBilistiwaSource] = useState('Kas Masjid');
  const [customBilistiwaSource, setCustomBilistiwaSource] = useState('');
  const [bilistiwaCategory, setBilistiwaCategory] = useState('Gaji');

  // Konfigurasi Kategori
  const unitNameMap: { [key: string]: string } = {
    masjid: 'Kas Masjid',
    kuttab: 'Kas Kuttab',
    wakpro: 'Kas Wakpro',
    bilistiwa: 'Kas Operasional Bilistiwa'
  };

  const displayTitle = slug === 'masjid' ? 'Kas Masjid' : slug === 'wakpro' ? 'Kas Wakaf Produktif (Wakpro)' : slug === 'bilistiwa' ? 'Kas Operasional Bilistiwa' : 'Kas Kuttab';

  const kuttabExpenseCategories = [
    'KONSUMSI', 'LISTRIK', 'ATK', 'KEBERSIHAN', 'CETAK SPANDUK', 'CETAK KERTAS', 
    'PERLENGKAPAN', 'PERALATAN', 'PULSA', 'TRANSPORT', 'ONGKOS KIRIM', 'KAFALAH', 
    'BINGKISAN', 'SARPRAS'
  ];
  const wakproSources = ['Wakpro BETA', 'Wakpro OAE', 'Wakpro Tympano', 'Wakpro BERA', 'Wakpro Tumbler', 'Infaq Umum', 'Wakpro Lainnya'];
  const wakproCategories = ['Kas Kuttab', 'Operasional', 'Sarana dan Prasarana', "Ta'awun", 'Hadiah', 'Kafalah'];
  
  const bilistiwaIncomeSources = ['Kas Masjid', 'Kas Wakpro', 'Infaq Umum', "Ta'awun", 'Lainnya'];
  const bilistiwaExpenseCategories = ['Gaji', 'Konsumsi', 'Transportasi', 'Listrik', 'Sampah', 'Bahan Bangunan', 'Perawatan Mesin', 'Perawatan Bangunan', 'Perlengkapan Masjid', 'Lainnya'];

  const loadData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: userData } = await supabase.from('users').select('role').eq('email', session.user.email).single();

    let currentRole = userData?.role;
    if (!currentRole) {
        if (session.user.email === 'visitor@kafmedan.com') currentRole = 'visitor';
        else currentRole = 'tu'; 
    }

    setUserRole(currentRole);

    if (currentRole !== 'visitor' && activeTab === 'laporan') setActiveTab('masuk');
    else if (currentRole === 'visitor') setActiveTab('laporan');

    const { data: pinData } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'tu_pin').single();
    if (pinData) setTuPin(pinData.setting_value);

    // Identifikasi Unit Database
    let unitLabel = 'Kuttab';
    if (slug === 'masjid') unitLabel = 'Masjid';
    else if (slug === 'wakpro') unitLabel = 'Wakpro';
    else if (slug === 'bilistiwa') unitLabel = 'Bilistiwa';

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

  const isAuthorized = userRole !== '' && userRole !== 'visitor';

  // ==========================================
  // FITUR EDIT & DELETE DENGAN PIN TU
  // ==========================================
  const handleActionClick = (trx: any, action: 'edit' | 'delete') => {
    if (!isAuthorized) return; 
    setSelectedTrx(trx);
    setActionType(action);
    setPinInput('');
    setPinError('');
    
    if (userRole === 'superadmin' || userRole === 'super_admin') {
         proceedAction(trx, action);
    } else {
         setPinModalOpen(true);
    }
  };

  const proceedAction = (trx: any, action: 'edit' | 'delete') => {
      if (action === 'delete') {
         executeDelete(trx.id);
      } else {
         setEditForm({
            amount: trx.amount,
            description: trx.description,
            program: trx.program || '',
            created_at: trx.created_at.split('T')[0],
            type: trx.type
         });
         setEditModalOpen(true);
      }
  }

  const verifyPinAndProceed = () => {
    if (pinInput === tuPin) {
      setPinModalOpen(false);
      proceedAction(selectedTrx, actionType as 'edit'|'delete');
    } else {
      setPinError('Maaf, PIN yang Anda masukkan salah!');
    }
  };

  const executeDelete = async (id: string) => {
    if (!isAuthorized) return;
    setLoading(true);
    await supabase.from('transactions').delete().eq('id', id);
    setSuccessMsg('✅ Transaksi berhasil dihapus.');
    loadData();
  };

  const handleUpdateTrx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return;
    setLoading(true);
    
    const safeDate = `${editForm.created_at}T12:00:00`;
    const { error } = await supabase.from('transactions').update({
      amount: Number(editForm.amount),
      description: editForm.description,
      program: editForm.program,
      created_at: safeDate,
      type: editForm.type
    }).eq('id', selectedTrx.id);

    if (!error) {
      setEditModalOpen(false);
      setSuccessMsg('✅ Transaksi berhasil diperbarui.');
      loadData();
    } else {
      setErrorMsg('❌ Gagal memperbarui: ' + error.message);
      setLoading(false);
    }
  };

  // ==========================================
  // FITUR SUBMIT KAS MASUK & KELUAR
  // ==========================================
  const handleKasMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return;
    
    setLoading(true); setSuccessMsg(''); setErrorMsg('');
    const numericAmount = Number(amount);
    if (numericAmount <= 0) { setErrorMsg('Nominal harus lebih dari 0.'); setLoading(false); return; }

    let unitLabel = 'Kuttab';
    if (slug === 'masjid') unitLabel = 'Masjid';
    else if (slug === 'wakpro') unitLabel = 'Wakpro';
    else if (slug === 'bilistiwa') unitLabel = 'Bilistiwa';

    let finalProgram = 'Infaq Umum'; let finalDesc = description;
    const safeTimestamp = `${customDate}T12:00:00`;

    if (slug === 'wakpro') {
      finalProgram = wakproSource === 'Wakpro Lainnya' ? (customWakpro || 'Wakpro Lainnya') : wakproSource;
      finalDesc = `Donatur/Muhsinin: ${donor || 'Hamba Allah'} - ${description}`;
    
    } else if (slug === 'kuttab') {
      finalProgram = kuttabSource === 'Kas Wakpro' ? 'Kas Wakpro' : (customKuttabSource || 'Lainnya');
      
      // Auto Potong Wakpro untuk Kuttab
      if (kuttabSource === 'Kas Wakpro') {
        const { data: allWakproTrx } = await supabase.from('transactions').select('*').eq('unit', 'Wakpro');
        let currentWakproBal = 0;
        allWakproTrx?.forEach(t => {
          if (t.type === 'Pemasukan') currentWakproBal += Number(t.amount);
          else currentWakproBal -= Number(t.amount);
        });

        if (numericAmount > currentWakproBal) {
          setErrorMsg(`Gagal: Saldo Kas Wakpro tidak mencukupi (Sisa: Rp ${currentWakproBal.toLocaleString('id-ID')})!`);
          setLoading(false); return;
        }

        await supabase.from('transactions').insert([{
          type: 'Pengeluaran', unit: 'Wakpro', program: 'Kas Kuttab',
          description: `Alokasi ke Kas Kuttab: ${description || 'Tanpa keterangan'}`, amount: numericAmount, created_at: safeTimestamp
        }]);
      }
    
    } else if (slug === 'bilistiwa') {
      finalProgram = bilistiwaSource === 'Lainnya' ? (customBilistiwaSource || 'Lainnya') : bilistiwaSource;
      
      // Auto Potong Masjid atau Wakpro untuk Bilistiwa
      if (bilistiwaSource === 'Kas Masjid' || bilistiwaSource === 'Kas Wakpro') {
        const sourceUnit = bilistiwaSource === 'Kas Masjid' ? 'Masjid' : 'Wakpro';
        const { data: allSourceTrx } = await supabase.from('transactions').select('*').eq('unit', sourceUnit);
        let currentSourceBal = 0;
        allSourceTrx?.forEach(t => {
          if (t.type === 'Pemasukan') currentSourceBal += Number(t.amount);
          else currentSourceBal -= Number(t.amount);
        });

        if (numericAmount > currentSourceBal) {
          setErrorMsg(`Gagal: Saldo ${bilistiwaSource} tidak mencukupi (Sisa: Rp ${currentSourceBal.toLocaleString('id-ID')})!`);
          setLoading(false); return;
        }

        await supabase.from('transactions').insert([{
          type: 'Pengeluaran', unit: sourceUnit, program: 'Alokasi Kas Bilistiwa',
          description: `Alokasi Operasional Bilistiwa: ${description || 'Tanpa keterangan'}`, amount: numericAmount, created_at: safeTimestamp
        }]);
      }
    
    } else {
      finalProgram = masjidSource;
    }

    // Insert Kas Masuk Unit Utama
    await supabase.from('transactions').insert([{
      type: 'Pemasukan', unit: unitLabel, program: finalProgram, description: finalDesc, amount: numericAmount, created_at: safeTimestamp
    }]);

    setLoading(false); setAmount(''); setDescription(''); setDonor(''); setCustomWakpro(''); setCustomKuttabSource(''); setCustomBilistiwaSource('');
    setSuccessMsg(`✅ Kas Masuk ${displayTitle} berhasil dicatat!`);
    loadData();
  };

  const handleKasKeluar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return; 
    
    setLoading(true); setSuccessMsg(''); setErrorMsg('');
    const numericAmount = Number(amount);
    if (numericAmount <= 0) { setErrorMsg('Nominal harus lebih dari 0.'); setLoading(false); return; }
    if (numericAmount > finalCalculatedBalance) { setErrorMsg(`Gagal: Saldo ${displayTitle} tidak mencukupi!`); setLoading(false); return; }

    let unitLabel = 'Kuttab';
    if (slug === 'masjid') unitLabel = 'Masjid';
    else if (slug === 'wakpro') unitLabel = 'Wakpro';
    else if (slug === 'bilistiwa') unitLabel = 'Bilistiwa';

    let finalProgram = masjidCategory; let finalDesc = description;
    const safeTimestamp = `${customDate}T12:00:00`;

    if (slug === 'kuttab') {
        finalProgram = kuttabCategory;
    } else if (slug === 'wakpro') { 
        finalProgram = wakproCategory; 
        finalDesc = `Penerima: ${receiver} - ${description}`; 
    } else if (slug === 'bilistiwa') {
        finalProgram = bilistiwaCategory;
        finalDesc = `Penerima: ${receiver} - ${description}`; 
    }

    await supabase.from('transactions').insert([{
      type: 'Pengeluaran', unit: unitLabel, program: finalProgram, description: finalDesc, amount: numericAmount, created_at: safeTimestamp
    }]);

    if (slug === 'wakpro' && wakproCategory === 'Kas Kuttab') {
      await supabase.from('transactions').insert([{
        type: 'Pemasukan', unit: 'Kuttab', program: 'Kas Wakpro',
        description: `Alokasi dari Kas Wakpro (Penerima: ${receiver})`, amount: numericAmount, created_at: safeTimestamp
      }]);
    }

    setLoading(false); setAmount(''); setDescription(''); setReceiver('');
    setSuccessMsg(`✅ Kas Keluar ${displayTitle} berhasil dicatat!`);
    loadData();
  };

  // ==========================================
  // LOGIKA LAPORAN & KALKULASI SALDO
  // ==========================================
  const filteredTransactions = transactions.filter(t => {
    if (!t.created_at) return true;
    const tDateOnly = t.created_at.split('T')[0];
    if (filterMode === 'hari') return tDateOnly === selectedDate;
    if (filterMode === 'bulan') return tDateOnly.startsWith(selectedMonth);
    if (filterMode === 'tahun') return tDateOnly.startsWith(selectedYear);
    if (filterMode === 'rentang') {
      if (!startDate || !endDate) return true;
      return tDateOnly >= startDate && tDateOnly <= endDate;
    }
    return true;
  });

  let runningBal = 0;
  const processedTransactions = filteredTransactions.map((t) => {
    const amt = Number(t.amount);
    if (t.type === 'Pemasukan') runningBal += amt; else runningBal -= amt;
    return { ...t, currentBalance: runningBal };
  });

  const finalCalculatedBalance = processedTransactions.length > 0 ? processedTransactions[processedTransactions.length - 1].currentBalance : 0;
  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(angka);

  // ==========================================
  // LOGIKA DIAGRAM PIE
  // ==========================================
  const pemasukanList = filteredTransactions.filter(t => t.type === 'Pemasukan');
  const pengeluaranList = filteredTransactions.filter(t => t.type === 'Pengeluaran');
  const totalIn = pemasukanList.reduce((acc, t) => acc + Number(t.amount), 0);
  const totalOut = pengeluaranList.reduce((acc, t) => acc + Number(t.amount), 0);

  const groupByCategory = (list: any[]) => {
    const map: { [key: string]: number } = {};
    list.forEach(t => {
      const cat = t.program || 'Lainnya';
      map[cat] = (map[cat] || 0) + Number(t.amount);
    });
    return map;
  };

  const inCategoryTotals = groupByCategory(pemasukanList);
  const outCategoryTotals = groupByCategory(pengeluaranList);

  const chartColors = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#F97316', '#EC4899', '#84CC16', '#14B8A6',
    '#6366F1', '#F43F5E', '#10B981', '#EAB308', '#A855F7'
  ];

  const generateConicGradient = (data: { [key: string]: number }, total: number) => {
    if (total === 0) return '#f3f4f6'; // Warna abu-abu jika kosong
    let cumulativePercent = 0;
    const segments = Object.entries(data).map(([cat, amount], idx) => {
      const percent = (amount / total) * 100;
      const color = chartColors[idx % chartColors.length];
      const segment = `${color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
      cumulativePercent += percent;
      return segment;
    });
    return `conic-gradient(${segments.join(', ')})`;
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <aside className="w-full md:w-64 bg-emerald-700 text-white flex flex-row md:flex-col justify-between items-center md:items-stretch p-4 md:p-6 shadow-md">
        <div className="text-xl md:text-2xl font-bold tracking-wider">AMANAH</div>
        <nav className="flex flex-col space-y-2 mt-4 text-sm w-full md:w-auto">
          <Link href="/" className="px-3 py-2 md:p-3 hover:bg-emerald-600 rounded-lg transition-colors text-center md:text-left block">
              ← Dashboard Utama
          </Link>
          
          {(userRole === 'superadmin' || userRole === 'super_admin') && (
            <Link href="/pengaturan" className="px-3 py-2 md:p-3 bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors mt-2 text-center md:text-left block font-medium">
                ⚙️ Pengaturan PIN
            </Link>
          )}
        </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto w-full max-w-full">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manajemen {displayTitle}</h1>
            <p className="text-gray-500 text-sm mt-1">Akses Login: 
               <span className={`font-bold uppercase px-2 py-0.5 ml-2 rounded text-xs text-white shadow-sm ${!userRole ? 'bg-gray-400' : userRole === 'visitor' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                   {userRole || 'MEMUAT...'}
               </span>
               {userRole === 'visitor' && <span className="ml-2 text-xs italic text-gray-400">(Hanya lihat Laporan)</span>}
            </p>
          </div>
          <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-200 self-start sm:self-auto">
            <span className="text-xs text-gray-500 block font-medium">Sisa Saldo:</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-700">Rp {formatRupiah(finalCalculatedBalance)}</span>
          </div>
        </header>

        {/* TAB MENU */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6 pb-2">
          {isAuthorized && (
            <>
              <button onClick={() => setActiveTab('masuk')} className={`py-2 px-4 sm:px-6 font-semibold text-sm rounded-lg transition-colors cursor-pointer ${activeTab === 'masuk' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                📥 Kas Masuk
              </button>
              <button onClick={() => setActiveTab('keluar')} className={`py-2 px-4 sm:px-6 font-semibold text-sm rounded-lg transition-colors cursor-pointer ${activeTab === 'keluar' ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                📤 Kas Keluar
              </button>
            </>
          )}
          <button onClick={() => setActiveTab('laporan')} className={`py-2 px-4 sm:px-6 font-semibold text-sm rounded-lg transition-colors cursor-pointer ${activeTab === 'laporan' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
            📊 Laporan & Log
          </button>
        </div>

        {successMsg && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm font-medium">{successMsg}</div>}
        {errorMsg && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium">{errorMsg}</div>}

        {/* =========================================================================
            TAMPILAN KAS MASUK 
        ========================================================================== */}
        {activeTab === 'masuk' && isAuthorized && (
          <div className="max-w-xl bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
             <h3 className="text-lg font-bold text-gray-800 mb-4">Form Kas Masuk {displayTitle}</h3>
             <form onSubmit={handleKasMasuk} className="space-y-4">
               <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Transaksi</label>
                  <input type="date" required value={customDate} onChange={e=>setCustomDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500" />
               </div>

               {slug === 'bilistiwa' && (
                 <>
                   <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1">Sumber Dana Bilistiwa</label>
                     <select value={bilistiwaSource} onChange={e=>setBilistiwaSource(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50">
                        {bilistiwaIncomeSources.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                     {(bilistiwaSource === 'Kas Masjid' || bilistiwaSource === 'Kas Wakpro') && (
                        <p className="text-xs text-amber-600 font-semibold mt-1.5">⚠️ Saldo {bilistiwaSource} akan terpotong otomatis.</p>
                     )}
                   </div>
                   {bilistiwaSource === 'Lainnya' && (
                     <input type="text" required placeholder="Sebutkan sumber lainnya..." value={customBilistiwaSource} onChange={e=>setCustomBilistiwaSource(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm mt-2 bg-gray-50 focus:bg-white" />
                   )}
                 </>
               )}

               {slug === 'wakpro' && (
                 <>
                   <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1">Sumber Dana Wakpro</label>
                     <select value={wakproSource} onChange={e=>setWakproSource(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50">
                        {wakproSources.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                   </div>
                   {wakproSource === 'Wakpro Lainnya' && (
                     <input type="text" required placeholder="Sebutkan sumber lainnya..." value={customWakpro} onChange={e=>setCustomWakpro(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm mt-2 bg-gray-50 focus:bg-white" />
                   )}
                   <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Donatur / Muhsinin</label>
                      <input type="text" required placeholder="Contoh: Hamba Allah" value={donor} onChange={e=>setDonor(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:bg-white" />
                   </div>
                 </>
               )}

               {slug === 'kuttab' && (
                  <>
                     <div>
                       <label className="block text-xs font-semibold text-gray-700 mb-1">Sumber Dana</label>
                       <select value={kuttabSource} onChange={e=>setKuttabSource(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50">
                          <option value="Kas Wakpro">Dari Kas Wakpro</option>
                          <option value="Lainnya">Sumber Lainnya</option>
                       </select>
                     </div>
                     {kuttabSource === 'Lainnya' && (
                         <input type="text" required placeholder="Tuliskan sumbernya..." value={customKuttabSource} onChange={e=>setCustomKuttabSource(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm mt-2 bg-gray-50 focus:bg-white" />
                     )}
                  </>
               )}

               {slug === 'masjid' && (
                 <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Infaq</label>
                    <select value={masjidSource} onChange={e=>setMasjidSource(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50">
                       <option value="Infaq Umum">Infaq Umum</option>
                       <option value="Jumat Berkah">Jumat Berkah</option>
                       <option value="Wakaf Tunai">Wakaf Tunai</option>
                       <option value="Lainnya">Lainnya</option>
                    </select>
                 </div>
               )}

               <div>
                 <label className="block text-xs font-semibold text-gray-700 mb-1">Keterangan Transaksi</label>
                 <textarea rows={2} required placeholder="Catatan detail..." value={description} onChange={e=>setDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500" />
               </div>

               <div>
                 <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal Rupiah</label>
                 <input type="number" required placeholder="Misal: 500000" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500" />
               </div>

               <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer">
                 {loading ? 'Memproses...' : 'Simpan Kas Masuk'}
               </button>
             </form>
          </div>
        )}

        {/* =========================================================================
            TAMPILAN KAS KELUAR 
        ========================================================================== */}
        {activeTab === 'keluar' && isAuthorized && (
          <div className="max-w-xl bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
             <h3 className="text-lg font-bold text-gray-800 mb-4">Form Kas Keluar {displayTitle}</h3>
             <form onSubmit={handleKasKeluar} className="space-y-4">
               <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Transaksi</label>
                  <input type="date" required value={customDate} onChange={e=>setCustomDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500" />
               </div>

               {slug === 'bilistiwa' && (
                 <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Pengeluaran Bilistiwa</label>
                    <select value={bilistiwaCategory} onChange={e=>setBilistiwaCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50">
                       {bilistiwaExpenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                 </div>
               )}

               {slug === 'wakpro' && (
                 <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Pengeluaran Wakpro</label>
                    <select value={wakproCategory} onChange={e=>setWakproCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50">
                       {wakproCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                 </div>
               )}

               {slug === 'kuttab' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Beban/Pengeluaran</label>
                    <select value={kuttabCategory} onChange={e=>setKuttabCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50">
                       {kuttabExpenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                 </div>
               )}

               {slug === 'masjid' && (
                 <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Operasional</label>
                    <select value={masjidCategory} onChange={e=>setMasjidCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50">
                       <option value="Operasional Masjid">Operasional Masjid</option>
                       <option value="Listrik & Air">Listrik & Air</option>
                       <option value="Perawatan / Kebersihan">Perawatan / Kebersihan</option>
                       <option value="Santunan / Sosial">Santunan / Sosial</option>
                    </select>
                 </div>
               )}

               {(slug === 'wakpro' || slug === 'bilistiwa') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Penerima</label>
                    <input type="text" required placeholder="Siapa penerima dananya?" value={receiver} onChange={e=>setReceiver(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500" />
                  </div>
               )}

               <div>
                 <label className="block text-xs font-semibold text-gray-700 mb-1">Keterangan / Tujuan Keluar</label>
                 <textarea rows={2} required placeholder="Rincian pengeluaran..." value={description} onChange={e=>setDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500" />
               </div>

               <div>
                 <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal Rupiah</label>
                 <input type="number" required placeholder="Misal: 250000" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500" />
               </div>

               <button type="submit" disabled={loading} className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm cursor-pointer">
                 {loading ? 'Memproses...' : 'Simpan Kas Keluar'}
               </button>
             </form>
          </div>
        )}

        {/* =========================================================================
            TAMPILAN LAPORAN & LOG & DIAGRAM PIE
        ========================================================================== */}
        {activeTab === 'laporan' && (
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 text-sm sm:text-base">🔍 Filter Laporan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tampilkan</label>
                  <select value={filterMode} onChange={e=>setFilterMode(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="semua">Seluruh Waktu</option>
                    <option value="hari">Per Hari</option>
                    <option value="bulan">Per Bulan</option>
                    <option value="tahun">Per Tahun</option>
                    <option value="rentang">Rentang Tanggal</option>
                  </select>
                </div>
                {filterMode === 'hari' && (
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Pilih Tanggal</label><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                )}
                {filterMode === 'bulan' && (
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Bulan & Tahun</label><input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                )}
                {filterMode === 'tahun' && (
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Ketik Tahun</label><input type="number" value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} placeholder="2026" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                )}
                {filterMode === 'rentang' && (
                  <><div className="flex-1"><label className="block text-xs text-gray-600 mb-1">Dari</label><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div className="flex-1"><label className="block text-xs text-gray-600 mb-1">Sampai</label><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div></>
                )}
              </div>
            </div>

            {/* DIAGRAM PIE / CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-6">
                 <div 
                    className="w-32 h-32 rounded-full shrink-0 shadow-inner border border-gray-100" 
                    style={{ background: generateConicGradient(inCategoryTotals, totalIn) }}>
                 </div>
                 <div className="w-full">
                    <h4 className="font-bold text-gray-800 mb-1">Grafik Pemasukan</h4>
                    <p className="text-xs text-gray-500 mb-3 border-b pb-2">Total: <span className="font-bold text-emerald-600">Rp {formatRupiah(totalIn)}</span></p>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-2 custom-scrollbar">
                       {Object.keys(inCategoryTotals).length === 0 ? (
                           <p className="text-xs text-gray-400 italic">Belum ada data pemasukan.</p>
                       ) : Object.entries(inCategoryTotals).map(([cat, amount], idx) => {
                           const pct = totalIn > 0 ? ((amount / totalIn) * 100).toFixed(1) : 0;
                           const color = chartColors[idx % chartColors.length];
                           return (
                             <div key={cat} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded-md border border-gray-100">
                                <div className="flex items-center gap-2">
                                   <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                                   <span className="text-gray-700 font-medium truncate max-w-[100px] sm:max-w-[130px]" title={cat}>{cat}</span>
                                </div>
                                <div className="text-right shrink-0">
                                   <span className="font-bold text-gray-900 mr-1">Rp {formatRupiah(amount)}</span>
                                   <span className="text-gray-500">({pct}%)</span>
                                </div>
                             </div>
                           )
                       })}
                    </div>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-6">
                 <div 
                    className="w-32 h-32 rounded-full shrink-0 shadow-inner border border-gray-100" 
                    style={{ background: generateConicGradient(outCategoryTotals, totalOut) }}>
                 </div>
                 <div className="w-full">
                    <h4 className="font-bold text-gray-800 mb-1">Grafik Pengeluaran</h4>
                    <p className="text-xs text-gray-500 mb-3 border-b pb-2">Total: <span className="font-bold text-red-600">Rp {formatRupiah(totalOut)}</span></p>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-2 custom-scrollbar">
                       {Object.keys(outCategoryTotals).length === 0 ? (
                           <p className="text-xs text-gray-400 italic">Belum ada data pengeluaran.</p>
                       ) : Object.entries(outCategoryTotals).map(([cat, amount], idx) => {
                           const pct = totalOut > 0 ? ((amount / totalOut) * 100).toFixed(1) : 0;
                           const color = chartColors[idx % chartColors.length];
                           return (
                             <div key={cat} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded-md border border-gray-100">
                                <div className="flex items-center gap-2">
                                   <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                                   <span className="text-gray-700 font-medium truncate max-w-[100px] sm:max-w-[130px]" title={cat}>{cat}</span>
                                </div>
                                <div className="text-right shrink-0">
                                   <span className="font-bold text-gray-900 mr-1">Rp {formatRupiah(amount)}</span>
                                   <span className="text-gray-500">({pct}%)</span>
                                </div>
                             </div>
                           )
                       })}
                    </div>
                 </div>
              </div>

            </div>

            {/* Tabel Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">Log Transaksi ({processedTransactions.length} Data)</h3>
                <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer shadow-sm">
                  Cetak PDF / Print
                </button>
              </div>
              
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-700">
                      <th className="p-4 font-semibold border-r">Tanggal</th>
                      <th className="p-4 font-semibold border-r w-1/3">Keterangan</th>
                      <th className="p-4 font-semibold border-r text-right text-emerald-700">Pemasukan</th>
                      <th className="p-4 font-semibold border-r text-right text-red-700">Pengeluaran</th>
                      <th className="p-4 font-semibold border-r text-right text-blue-700">Sisa Saldo</th>
                      <th className="p-4 font-semibold border-r">Kategori</th>
                      
                      {isAuthorized && (
                          <th className="p-4 font-semibold text-center">Tindakan</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} className="p-10 text-center text-gray-500 font-medium animate-pulse">Menyiapkan buku kas...</td></tr> : 
                     processedTransactions.length > 0 ? processedTransactions.map((trx) => {
                        const tDate = new Date(trx.created_at);
                        const displayDate = `${String(tDate.getDate()).padStart(2,'0')}/${String(tDate.getMonth()+1).padStart(2,'0')}/${tDate.getFullYear()}`;
                        return (
                          <tr key={trx.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4 border-r whitespace-nowrap text-gray-500">{displayDate}</td>
                            <td className="p-4 border-r text-gray-800 font-medium">{trx.description}</td>
                            <td className="p-4 border-r text-right text-emerald-600 font-semibold">{trx.type === 'Pemasukan' ? formatRupiah(trx.amount) : ''}</td>
                            <td className="p-4 border-r text-right text-red-600 font-semibold">{trx.type === 'Pengeluaran' ? formatRupiah(trx.amount) : ''}</td>
                            <td className="p-4 border-r text-right font-extrabold text-gray-900 bg-gray-50/50">{formatRupiah(trx.currentBalance)}</td>
                            <td className="p-4 border-r">
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold whitespace-nowrap border border-blue-100">
                                    {trx.program || '-'}
                                </span>
                            </td>

                            {isAuthorized && (
                                <td className="p-3 text-center whitespace-nowrap align-middle">
                                    <button onClick={() => handleActionClick(trx, 'edit')} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md mx-1 font-semibold text-xs shadow-sm cursor-pointer transition-colors">
                                        Edit
                                    </button>
                                    <button onClick={() => handleActionClick(trx, 'delete')} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-md mx-1 font-semibold text-xs shadow-sm cursor-pointer transition-colors">
                                        Hapus
                                    </button>
                                </td>
                            )}
                          </tr>
                        );
                    }) : <tr><td colSpan={7} className="p-10 text-center text-gray-400 bg-gray-50">Belum ada catatan transaksi.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: PIN OTORISASI TU
      ========================================================================== */}
      {pinModalOpen && isAuthorized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">🔒</div>
              <h3 className="text-xl font-extrabold text-center text-gray-800 mb-1">Otorisasi TU</h3>
              <p className="text-xs text-center text-gray-500 mb-6 px-4 leading-relaxed">
                  Masukkan PIN rahasia untuk {actionType === 'delete' ? <span className="font-bold text-red-600">MENGHAPUS</span> : 'mengedit'} transaksi ini.
              </p>
              
              <input 
                  type="password" 
                  value={pinInput} 
                  onChange={e=>setPinInput(e.target.value)} 
                  autoFocus
                  className="w-full border-2 border-gray-200 p-4 rounded-xl mb-2 text-center text-3xl tracking-[0.4em] font-bold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 bg-gray-50" 
                  placeholder="••••" 
              />
              {pinError && <p className="text-red-600 text-xs font-bold mt-2 text-center bg-red-50 py-2 rounded-lg">{pinError}</p>}
              
              <div className="flex justify-between gap-3 mt-8">
                 <button onClick={()=>setPinModalOpen(false)} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold text-sm cursor-pointer">
                     Batal
                 </button>
                 <button onClick={verifyPinAndProceed} className="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold text-sm shadow-md cursor-pointer">
                     Verifikasi
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FORM EDIT TRANSAKSI
      ========================================================================== */}
      {editModalOpen && isAuthorized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md m-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">✍️ Edit Transaksi</h3>
              <form onSubmit={handleUpdateTrx} className="space-y-5">
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Tanggal Transaksi</label>
                    <input type="date" required value={editForm.created_at} onChange={e=>setEditForm({...editForm, created_at: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Jenis Arus Kas</label>
                    <select required value={editForm.type} onChange={e=>setEditForm({...editForm, type: e.target.value})} className={`w-full border-2 border-gray-200 p-3 rounded-xl text-sm outline-none transition-all font-bold ${editForm.type === 'Pemasukan' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                        <option value="Pemasukan">Pemasukan (Masuk)</option>
                        <option value="Pengeluaran">Pengeluaran (Keluar)</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Kategori / Program</label>
                    <input type="text" required value={editForm.program} onChange={e=>setEditForm({...editForm, program: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl text-sm focus:border-blue-500 outline-none font-medium" />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Uraian Keterangan</label>
                    <textarea rows={2} required value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl text-sm focus:border-blue-500 outline-none font-medium leading-relaxed" />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Nominal Uang (Rp)</label>
                    <input type="number" required value={editForm.amount} onChange={e=>setEditForm({...editForm, amount: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl text-lg font-bold text-gray-900 focus:border-blue-500 outline-none" />
                 </div>

                 <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button type="button" onClick={()=>setEditModalOpen(false)} className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold text-sm cursor-pointer">
                        Batal
                    </button>
                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-md cursor-pointer">
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}