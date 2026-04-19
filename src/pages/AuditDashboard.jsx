import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Search,
} from "lucide-react";

const AuditDashboard = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditData, setAuditData] = useState({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 25;

  const FIELDS = [
    "linkedin_url",
    "instagram_url",
    "facebook_url",
    "tiktok_url",
    "email",
    "no_hp",
    "tempat_kerja",
    "alamat_kerja",
    "posisi",
    "jenis_instansi",
    "sosmed_kantor",
  ];

  useEffect(() => {
    fetchAuditData();
  }, [currentPage]);

  // Ganti fungsi fetchAuditData di src/pages/AuditDashboard.jsx
  // EDIT pada src/pages/AuditDashboard.jsx
  const fetchAuditData = async () => {
    setLoading(true);
    const from = currentPage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      const { data, count } = await supabase
        .from("alumni")
        .select("*", { count: "exact" })
        .ilike("status_pelacakan", "%Teridentifikasi%")

        // HAPUS sort_priority, gunakan ini sebagai satu-satunya parameter utama:
        .order("total_audit_score", { ascending: false })

        .range(from, to);

      setAlumni(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Sorting Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAuditModal = (item) => {
    setSelectedAlumni(item);
    setAuditData(item.manual_validation_detail || {});
    setIsModalOpen(true);
  };

  const handleAuditChange = (field, status) => {
    setAuditData({ ...auditData, [field]: status });
  };

  const saveManualAudit = async () => {
    const matchCount = Object.values(auditData).filter(
      (v) => v === "Match",
    ).length;
    const manualScore = Math.round((matchCount / 11) * 100);

    const { error } = await supabase
      .from("alumni")
      .update({
        manual_score: manualScore,
        manual_validation_detail: auditData,
      })
      .eq("id", selectedAlumni.id);

    if (!error) {
      setIsModalOpen(false);
      fetchAuditData();
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Halaman */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={32} /> Quality
            Assurance Audit
          </h1>
          <p className="text-slate-500 font-medium">
            Validasi akurasi data hasil pelacakan bot (Human-in-the-loop)
          </p>
        </div>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30">
          Total: {totalCount} Data Teridentifikasi
        </div>
      </div>

      {/* Tabel Audit Modern */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-5 text-xs uppercase tracking-widest font-black">
                Nama Alumni
              </th>
              <th className="p-5 text-center text-xs uppercase tracking-widest font-black">
                Auto Score
              </th>
              <th className="p-5 text-center text-xs uppercase tracking-widest font-black">
                Manual Score
              </th>
              <th className="p-5 text-center text-xs uppercase tracking-widest font-black">
                Akurasi Gap
              </th>
              <th className="p-5 text-center text-xs uppercase tracking-widest font-black">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-20 text-center text-slate-400 animate-pulse font-bold"
                >
                  Memuat data audit...
                </td>
              </tr>
            ) : (
              alumni.map((item) => {
                const gap = Math.abs(item.auto_score - item.manual_score);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-5 font-black text-slate-800">
                      {item.nama}
                    </td>
                    <td className="p-5 text-center font-bold text-blue-600 bg-blue-50/30">
                      {item.auto_score}%
                    </td>
                    <td className="p-5 text-center font-bold text-emerald-600 bg-emerald-50/30">
                      {item.manual_score}%
                    </td>
                    <td className="p-5 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${gap <= 10 ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}
                      >
                        {gap}% {gap <= 10 ? "• VALID" : "• HIGH GAP"}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => openAuditModal(item)}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-600 transition shadow-sm"
                      >
                        <Edit3 size={14} /> Audit Manual
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* PAGINATION CONTROL */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
            Halaman {currentPage + 1} dari {totalPages || 1}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20"
            >
              <ChevronLeft size={20} />
            </button>

            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-xl font-black text-sm transition ${currentPage === pageNum ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "hover:bg-white text-slate-400"}`}
                >
                  {pageNum + 1}
                </button>
              );
            })}

            <button
              disabled={currentPage + 1 >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL AUDIT (Tetap dipertahankan dengan styling lebih bersih) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Audit Verifikasi: {selectedAlumni.nama}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-rose-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {FIELDS.map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100"
                >
                  <span className="text-sm font-bold text-slate-600 capitalize">
                    {field.replace(/_url|_/g, " ")}
                  </span>
                  <div className="flex bg-slate-200 p-1 rounded-xl">
                    {["Match", "Miss", "Null"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleAuditChange(field, status)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${
                          auditData[field] === status
                            ? status === "Match"
                              ? "bg-emerald-500 text-white"
                              : status === "Miss"
                                ? "bg-rose-500 text-white"
                                : "bg-slate-600 text-white"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                onClick={saveManualAudit}
                className="bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition"
              >
                Simpan Hasil Audit
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditDashboard;
