"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function ManajemenUser() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    email: '', 
    full_name: '',
    role: 'PENGURUS', 
    allowed_units: ['Masjid', 'Kuttab', 'Wakpro', 'Bilistiwa'] 
  });
  const [msg, setMsg] = useState('');

  const allUnits = ['Masjid', 'Kuttab', 'Wakpro', 'Bilistiwa'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.email !== 'liza@mah.com') {
      router.push('/');
      return;
    }
    setUserEmail(session.user.email);

    const { data } = await supabase.from('users').select('*').order('email', { ascending: true });
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleCheckbox = (unit: string) => {
    setFormData(prev => {
      const units = prev.allowed_units || [];
      if (units.includes(unit)) {
        return { ...prev, allowed_units: units.filter(u => u !== unit) };
      }
      return { ...prev, allowed_units: [...units, unit] };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('Menyimpan data...');
    
    if (editId) {
      // Update akses user yang sudah ada
      const { error } = await supabase.from('users').update({ 
        role: formData.role, 
        allowed_units: formData.allowed_units 
      }).eq('id', editId);
       
      if (!error) { 
        setMsg('Berhasil diperbarui.'); 
        setFormOpen(false); 
        loadUsers(); 
      } else {
        setMsg('Gagal: ' + error.message);
      }
    } else {
      // Tambah user baru: sertakan id acak dan full_name agar tidak ditolak constraint database
      const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'usr_' + Date.now();
      const defaultName = formData.full_name || formData.email.split('@')[0];

      const { error } = await supabase.from('users').insert([{ 
        id: generatedId,
        full_name: defaultName,
        email: formData.email, 
        role: formData.role, 
        allowed_units: formData.allowed_units 
      }]);

      if (!error) { 
        setMsg('Pengguna berhasil ditambahkan.'); 
        setFormOpen(false); 
        loadUsers(); 
      } else {
        setMsg('Gagal: ' + error.message);
      }
    }
  };

  const openForm = (u: any = null) => {
    setMsg('');
    if (u) {
      setEditId(u.id);
      setFormData({ 
        email: u.email, 
        full_name: u.full_name || '',
        role: u.role || 'PENGURUS', 
        allowed_units: u.allowed_units || allUnits 
      });
    } else {
      setEditId(null);
      setFormData({ 
        email: '', 
        full_name: '',
        role: 'PENGURUS', 
        allowed_units: allUnits 
      });
    }
    setFormOpen(true);
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Memverifikasi akses...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen bg-gray-50">
      <Link href="/" className="text-emerald-700 font-bold hover:underline mb-6 inline-block">← Kembali ke Dashboard</Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Manajemen Hak Akses & User</h1>
          <p className="text-gray-500 text-sm">Akun Administrator: <span className="font-bold text-blue-600">{userEmail}</span></p>
        </div>
        <button onClick={() => openForm()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-colors">
          + Tambah Akses Akun
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-4 font-bold text-gray-700">Email Akun</th>
                <th className="p-4 font-bold text-gray-700">Peran</th>
                <th className="p-4 font-bold text-gray-700">Unit yang Diizinkan</th>
                <th className="p-4 font-bold text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id || u.email} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-800">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${u.role === 'VIEWER' || u.role === 'visitor' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {u.role === 'VIEWER' || u.role === 'visitor' ? 'Hanya Lihat' : 'Pengurus (Input/Edit)'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {(u.allowed_units || allUnits).map((unit: string) => (
                        <span key={unit} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs font-semibold">
                          {unit}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => openForm(u)} className="px-4 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-lg border border-gray-300 text-xs transition-colors">
                      Edit Akses
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{editId ? 'Edit Akses Pengguna' : 'Tambah Akses Pengguna Baru'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Alamat Email</label>
                <input 
                  type="email" 
                  required 
                  disabled={!!editId} 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  className="w-full border p-3 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="pakde@kafmedan.com" 
                />
              </div>

              {!editId && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nama Pengguna (Opsional)</label>
                  <input 
                    type="text" 
                    value={formData.full_name} 
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                    className="w-full border p-3 rounded-xl bg-gray-50 text-sm focus:bg-white outline-none" 
                    placeholder="Contoh: Pakde" 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Peran / Jabatan</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value })} 
                  className="w-full border p-3 rounded-xl bg-gray-50 text-sm focus:bg-white outline-none"
                >
                  <option value="PENGURUS">Pengurus (Bisa Catat & Edit Kas)</option>
                  <option value="VIEWER">Viewer (Hanya Lihat Laporan)</option>
                  <option value="BENDAHARA">Bendahara</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Pilih Akses Unit Kasir (Centang)</label>
                <div className="grid grid-cols-2 gap-3">
                  {allUnits.map(unit => (
                    <label key={unit} className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={(formData.allowed_units || []).includes(unit)} 
                        onChange={() => handleCheckbox(unit)} 
                        className="w-4 h-4 accent-blue-600 rounded" 
                      />
                      <span className="font-semibold text-gray-700 text-sm">{unit}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setFormOpen(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm transition-colors">
                  Batal
                </button>
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors">
                  Simpan Pengaturan
                </button>
              </div>
              {msg && <p className="text-center text-xs font-bold text-blue-600 mt-2">{msg}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}