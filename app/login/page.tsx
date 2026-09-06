"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Gagal masuk: Email atau password salah.');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden">
      {/* Background Image dengan efek gelap tipis agar form kontras */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 filter brightness-90"
        style={{ backgroundImage: `url('/bg-login.jfif')` }}
      />
      
      {/* Lapisan Gelap Transparan (Overlay) */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Kotak Form Login di Tengah */}
      <div className="relative z-20 w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-emerald-800 tracking-wide">AMANAH</h2>
          <p className="text-sm text-gray-600 mt-1">Sistem Keuangan Terpadu Masjid, Kuttab & Wakpro</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm bg-white text-gray-800 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm bg-white text-gray-800 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-all shadow-md cursor-pointer disabled:bg-emerald-400 text-sm tracking-wide"
          >
            {loading ? 'Memproses Masuk...' : 'Masuk (Login)'}
          </button>
        </form>
      </div>
    </div>
  );
}