import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AddAlumniForm({ onAdded }) {
  const [formData, setFormData] = useState({
    nim: "",
    nama: "",
    prodi: "",
    tahun_lulus: 2024,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("alumni").insert([formData]);
    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      alert("Alumni berhasil ditambahkan!");
      setFormData({ nim: "", nama: "", prodi: "", tahun_lulus: 2024 });
      onAdded();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl border border-slate-200 mb-8 grid grid-cols-4 gap-4 items-end shadow-sm"
    >
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase">
          NIM
        </label>
        <input
          type="text"
          className="w-full border p-2 rounded-lg text-sm"
          placeholder="Contoh: 2023..."
          value={formData.nim}
          onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase">
          Nama Lengkap
        </label>
        <input
          type="text"
          className="w-full border p-2 rounded-lg text-sm"
          placeholder="Nama asli alumni..."
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase">
          Prodi
        </label>
        <input
          type="text"
          className="w-full border p-2 rounded-lg text-sm"
          placeholder="Informatika..."
          value={formData.prodi}
          onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
          required
        />
      </div>
      <button
        type="submit"
        className="bg-indigo-600 text-white p-2 rounded-lg font-bold hover:bg-indigo-700 transition"
      >
        Simpan Alumni
      </button>
    </form>
  );
}
