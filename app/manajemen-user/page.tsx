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
  
  // State Form
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', role: 'tu', allowed_units: ['Masjid', 'Kuttab', 'Wakpro', 'Bilistiwa'] });
  const [msg, setMsg] = useState('');

  const allUnits = ['Masjid', 'Kuttab', 'Wakpro', 'Bilistiwa'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.email !== 'liza@mah.com') {
      router.push('/'); // Kunci keamanan mutlak, tendang jika bukan liza
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
      if (units.includes(unit)) return { ...prev, allowed_units: units.filter(u => u !== unit) };
      else return { ...prev, allowed_units: [...units, unit] };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('Menyimpan data...');
    
    if (editId) {
       // Update User yang ada
       const { error } = await supabase.from('users').update({ 
           role: formData.role, 
           allowed_units: formData.allowed_units 
       }).eq('id', editId);
       
       if (!error) { setMsg('✅ Berhasil diperbarui!'); setFormOpen(false); loadUsers(); }
       else setMsg('❌ Gagal: ' + error.message);
    } else {
       // Tambah User Baru ke tabel
       const { error } = await supabase.from('users').insert([{ 
           email: formData.email, 
           role: formData.role, 
           allowed_units: formData.allowed_units 
       }]);

       if (!error) { 
           setMsg('✅ Pengguna ditambahkan! (Note: Ingat untuk buat password loginnya di Supabase Auth)'); 
           setFormOpen(false); loadUsers(); 
       } else setMsg('❌ Gagal: ' + error.message);
    }
  };

  const openForm = (u: any = null) => {
    setMsg('');
    if (u) {
      setEditId(u.id);
      setFormData({ email: u.email, role: u.role || 'tu', allowed_units: u.allowed_units || allUnits });
    } else {
      setEditId(null);
      setFormData({ email: '', role: 'tu', allowed_units: allUnits });
    }
    setFormOpen(true);
  };

  if (loading) return <div className="p-10 text-center">Memverifikasi akses Liza...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
      <Link href="/" className="text-emerald-700 font-bold hover:underline mb-6 inline-block">← Kembali ke Dashboard</Link>
      
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-800">Manajemen Hak Akses & User</h1>
           <p className="text-gray-500">Khusus Administrator: <span className="font-bold text-blue-600">{userEmail}</span></p>
        </div>
        <button onClick={() => openForm()} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md">
           + Tambah Hak Akses Akun
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-4 font-bold text-gray-700">Email Akun</th>
              <th className="p-4 font-bold text-gray-700">Jabatan (Role)</th>
              <th className="p-4 font-bold text-gray-700">Akses Kasir (Unit)</th>
              <th className="p-4 font-bold text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-800">{u.email}</td>
                <td className="p-4 uppercase text-xs font-extrabold text-gray-500">{u.role || 'TU'}</td>
                <td className="p-4">
                   <div className="flex gap-1 flex-wrap">
                      {(u.allowed_units || allUnits).map((unit: string) => (
                         <span key={unit} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">{unit}</span>
                      ))}
                   </div>
                </td>
                <td className="p-4 text-center">
                   <button onClick={() => openForm(u)} className="px-4 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-md border border-gray-300">Edit Akses</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
           <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-6">{editId ? 'Edit Akses Pengguna' : 'Tambah Akses Pengguna Baru'}</h3>
              <form onSubmit={handleSave} className="space-y-5">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Alamat Email</label>
                    <input type="email" required disabled={!!editId} value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full border p-3 rounded-lg bg-gray-50" placeholder="contoh@kafmedan.com"/>
                    {!editId && <p className="text-xs text-amber-600 mt-1">*Pastikan email ini juga didaftarkan di Supabase Authentication agar bisa Login.</p>}
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Jabatan (Role)</label>
                    <select value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="w-full border p-3 rounded-lg bg-gray-50">
                       <option value="tu">Tata Usaha (Admin Biasa)</option>
                       <option value="visitor">Visitor (Hanya Lihat Laporan)</option>
                       <option value="superadmin">Superadmin (Akses Penuh)</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Akses Unit Kasir (Centang)</label>
                    <div className="grid grid-cols-2 gap-3">
                       {allUnits.map(unit => (
                          <label key={unit} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                             <input type="checkbox" checked={(formData.allowed_units || []).includes(unit)} onChange={() => handleCheckbox(unit)} className="w-5 h-5 accent-blue-600" />
                             <span className="font-semibold text-gray-700 text-sm">{unit}</span>
                          </label>
                       ))}
                    </div>
                 </div>

                 <div className="flex gap-3 mt-6 pt-4 border-t">
                    <button type="button" onClick={()=>setFormOpen(false)} className="w-full py-3 bg-gray-200 text-gray-800 rounded-xl font-bold">Batal</button>
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Simpan Pengaturan</button>
                 </div>
                 {msg && <p className="text-center text-sm font-bold text-blue-600 mt-2">{msg}</p>}
              </form>
           </div>
        </div>
      )}
    </div>
  );
}