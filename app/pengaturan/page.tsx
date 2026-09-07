"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PengaturanPage() {
  const [pin, setPin] = useState('');
  const [userRole, setUserRole] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserAndLoadPin();
  }, []);

  const checkUserAndLoadPin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // Ambil Role User
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userData) {
      setUserRole(userData.role);
    }

    // Jika bukan super_admin / superadmin, tolak akses (Tunggu sampai role ter-load baru di cek)
    if (userData?.role !== 'superadmin' && userData?.role !== 'super_admin') {
       setLoading(false);
       return;
    }

    // Ambil PIN saat ini dari app_settings
    const { data: pinData } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'tu_pin')
      .single();

    if (pinData) {
      setPin(pinData.setting_value);
    }
    
    setLoading(false);
  };

  const savePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
        setMsg('Gagal: PIN harus minimal 4 karakter!');
        return;
    }

    const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: pin })
        .eq('setting_key', 'tu_pin');

    if (error) {
        setMsg('Gagal menyimpan PIN: ' + error.message);
    } else {
        setMsg('Alhamdulillah, PIN Otorisasi TU berhasil diperbarui!');
    }
  };

  if (loading) {
      return <div className="p-10 text-center font-medium">Memuat halaman pengaturan...</div>;
  }

  // Proteksi Halaman Khusus Super Admin
  if (userRole !== 'superadmin' && userRole !== 'super_admin') {
    return (
        <div className="p-10 max-w-xl mx-auto mt-20 bg-red-50 border border-red-200 rounded-xl text-center shadow-sm">
            <h2 className="text-xl font-bold text-red-700 mb-2">Akses Ditolak!</h2>
            <p className="text-red-600 mb-4">Halaman ini hanya dapat diakses oleh akun Super Admin.</p>
            <Link href="/" className="text-emerald-700 font-semibold hover:underline">← Kembali ke Dashboard</Link>
        </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-xl mx-auto bg-gray-50 min-h-screen">
      <Link href="/" className="text-emerald-700 hover:underline mb-6 inline-block font-medium">
          ← Kembali ke Dashboard
      </Link>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">⚙️ Pengaturan Keamanan Aplikasi</h1>
        <p className="text-sm text-gray-500 mb-8">
            Ubah PIN Otorisasi khusus yang diperlukan oleh akun Tata Usaha (TU) untuk melakukan Edit atau Hapus transaksi.
        </p>
        
        <form onSubmit={savePin} className="space-y-5">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
                PIN Otorisasi TU Saat Ini:
            </label>
            <input 
                type="text" 
                required 
                value={pin} 
                onChange={(e) => setPin(e.target.value)} 
                className="border border-gray-300 p-4 rounded-xl w-full text-center tracking-[0.5em] text-2xl font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50" 
                placeholder="Masukkan PIN baru"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">Boleh angka atau huruf (Minimal 4 karakter)</p>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-4 rounded-xl transition-colors shadow-sm"
          >
              Simpan Perubahan PIN
          </button>
        </form>

        {msg && (
            <div className={`mt-6 p-4 rounded-lg text-sm text-center font-medium ${msg.includes('Gagal') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                {msg}
            </div>
        )}
      </div>
    </div>
  );
}