import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  calculateAutoScore,
  calculateManualScore,
  AUDIT_FIELDS,
} from "../lib/scoringLogic";

const AuditDashboard = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditData, setAuditData] = useState({});

  const [isSosmedModalOpen, setIsSosmedModalOpen] = useState(false);
  const [currentSosmed, setCurrentSosmed] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [currentWork, setCurrentWork] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 25;

  const [sortConfig, setSortConfig] = useState({
    column: "status_pelacakan",
    order: "desc",
  });

  useEffect(() => {
    fetchAuditData();
  }, [currentPage, sortConfig]);

  const fetchAuditData = async () => {
    setLoading(true);
    const from = currentPage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      let query = supabase
        .from("alumni")
        .select("*", { count: "exact" })
        .ilike("status_pelacakan", "%Teridentifikasi%");

      if (sortConfig.column === "zero_score") {
        query = query.or("auto_score.eq.0,auto_score.is.null");
      } else if (sortConfig.column === "random") {
        query = query.order("id", { ascending: Math.random() > 0.5 });
      } else {
        query = query.order(sortConfig.column, {
          ascending: sortConfig.order === "asc",
        });
      }

      const { data, count } = await query.range(from, to);
      setAlumni(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAuditModal = (item) => {
    setSelectedAlumni(item);
    const syncAuditData = {};

    AUDIT_FIELDS.forEach((field) => {
      const isDataExist =
        item[field] &&
        item[field].toString().trim() !== "" &&
        item[field] !== "-";

      if (!isDataExist) {
        syncAuditData[field] = "Null";
      } else {
        syncAuditData[field] =
          item.manual_validation_detail?.[field] || "Match";
      }
    });

    setAuditData(syncAuditData);
    setIsModalOpen(true);
  };

  const openSosmedModal = (item) => {
    setCurrentSosmed({
      linkedin: item.linkedin_url,
      instagram: item.instagram_url,
      facebook: item.facebook_url,
      tiktok: item.tiktok_url,
    });
    setIsSosmedModalOpen(true);
  };

  const openContactModal = (item) => {
    setCurrentContact({ email: item.email, no_hp: item.no_hp });
    setIsContactModalOpen(true);
  };

  const openWorkModal = (item) => {
    setCurrentWork({
      posisi: item.posisi,
      instansi: item.tempat_kerja,
      jenis_instansi: item.jenis_instansi,
      alamat: item.alamat_kerja,
      sosmed_kantor: item.sosmed_kantor,
    });
    setIsWorkModalOpen(true);
  };

  const handleAuditChange = (field, status) => {
    const isEmpty =
      !selectedAlumni[field] || selectedAlumni[field].toString().trim() === "";
    if (status === "Match" && isEmpty) return;

    setAuditData({ ...auditData, [field]: status });
  };

  const saveManualAudit = async () => {
    const matchCount = Object.values(auditData).filter(
      (v) => v === "Match",
    ).length;
    const synchronizedScore = Math.round((matchCount / 11) * 100);

    const { error } = await supabase
      .from("alumni")
      .update({
        manual_score: synchronizedScore,
        manual_validation_detail: auditData,
      })
      .eq("id", selectedAlumni.id);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="animate-in fade-in duration-500 p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={32} /> QA Audit
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Monitoring Akurasi Data Berbasis Bukti Aktual
          </p>
        </div>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30">
          Total: {totalCount} Data
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setSortConfig({ column: "manual_score", order: "desc" });
            setCurrentPage(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${sortConfig.column === "manual_score" && sortConfig.order === "desc" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border"}`}
        >
          ↑ Skor Tertinggi
        </button>
        <button
          onClick={() => {
            setSortConfig({ column: "manual_score", order: "asc" });
            setCurrentPage(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${sortConfig.column === "manual_score" && sortConfig.order === "asc" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border"}`}
        >
          ↓ Skor Terendah
        </button>
        <button
          onClick={() => {
            setSortConfig({ column: "random", order: "desc" });
            setCurrentPage(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${sortConfig.column === "random" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border"}`}
        >
          🎲 Acak Data
        </button>
        <button
          onClick={() => {
            setSortConfig({ column: "auto_score", order: "asc" });
            setCurrentPage(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${sortConfig.column === "auto_score" && sortConfig.order === "asc" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border"}`}
        >
          ⚠️ Skor 0% (Data Kosong)
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-5 text-xs font-black uppercase sticky left-0 bg-slate-900 z-10">
                  Nama
                </th>
                <th className="p-5 text-xs font-black uppercase">NIM</th>
                <th className="p-5 text-xs font-black uppercase">Prodi</th>
                <th className="p-5 text-center text-xs font-black uppercase">
                  Sosmed
                </th>
                <th className="p-5 text-center text-xs font-black uppercase">
                  Kontak
                </th>
                <th className="p-5 text-center text-xs font-black uppercase">
                  Karir
                </th>
                <th className="p-5 text-center text-xs font-black uppercase text-blue-400">
                  Auto
                </th>
                <th className="p-5 text-center text-xs font-black uppercase text-emerald-400">
                  Manual
                </th>
                <th className="p-5 text-center text-xs font-black uppercase">
                  Gap
                </th>
                <th className="p-5 text-center text-xs font-black uppercase sticky right-0 bg-slate-900 z-10">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    className="p-20 text-center text-slate-400 font-bold animate-pulse"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : (
                alumni.map((item) => {
                  const auto = calculateAutoScore(item);
                  const gap = Math.abs(auto - item.manual_score);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition group text-sm"
                    >
                      <td className="p-5 font-black text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                        {item.nama}
                      </td>
                      <td className="p-5 text-slate-500 font-medium">
                        {item.nim}
                      </td>
                      <td className="p-5 text-slate-500 text-xs">
                        {item.prodi}
                      </td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => openSosmedModal(item)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                        >
                          <Search size={16} />
                        </button>
                      </td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => openContactModal(item)}
                          className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition"
                        >
                          <Search size={16} />
                        </button>
                      </td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => openWorkModal(item)}
                          className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition inline-flex items-center gap-2"
                        >
                          <Search size={14} />{" "}
                          <span className="text-[10px] font-black uppercase">
                            Detail
                          </span>
                        </button>
                      </td>
                      <td className="p-5 text-center font-bold text-blue-600">
                        {auto}%
                      </td>
                      <td className="p-5 text-center font-bold text-emerald-600">
                        {item.manual_score}%
                      </td>
                      <td className="p-5 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black ${gap <= 10 ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {gap}% {gap <= 10 ? "• VALID" : "• GAP"}
                        </span>
                      </td>
                      <td className="p-5 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-100">
                        <button
                          onClick={() => openAuditModal(item)}
                          className="bg-slate-900 text-white p-2 rounded-lg hover:bg-indigo-600 transition"
                        >
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
            Halaman {currentPage + 1} dari {totalPages || 1}
          </p>
          <div className="flex gap-1">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-lg hover:bg-white border disabled:opacity-20"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              disabled={currentPage + 1 >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-lg hover:bg-white border disabled:opacity-20"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {[
        {
          open: isSosmedModalOpen,
          setOpen: setIsSosmedModalOpen,
          title: "Media Sosial",
          data: currentSosmed,
          type: "url",
        },
        {
          open: isContactModalOpen,
          setOpen: setIsContactModalOpen,
          title: "Informasi Kontak",
          data: currentContact,
          type: "text",
        },
        {
          open: isWorkModalOpen,
          setOpen: setIsWorkModalOpen,
          title: "Detail Karir & Instansi",
          data: currentWork,
          type: "text",
        },
      ].map(
        (modal, idx) =>
          modal.open && (
            <div
              key={idx}
              className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex justify-end"
            >
              <div className="bg-white w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-300 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase">
                    {modal.title}
                  </h3>
                  <button
                    onClick={() => modal.setOpen(false)}
                    className="text-slate-400 hover:text-rose-500 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-5">
                  {modal.data &&
                    Object.entries(modal.data).map(([key, value]) => (
                      <div
                        key={key}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
                      >
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                          {key.replace("_", " ")}
                        </p>
                        {value ? (
                          modal.type === "url" &&
                          value.toString().includes("http") ? (
                            <a
                              href={value}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-bold text-indigo-600 flex items-center gap-2 break-all hover:underline"
                            >
                              {value} <ExternalLink size={14} />
                            </a>
                          ) : (
                            <p className="text-sm font-bold text-slate-800 break-words">
                              {value}
                            </p>
                          )
                        ) : (
                          <p className="text-sm font-bold text-slate-300 italic">
                            Data Kosong
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ),
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Audit: {selectedAlumni.nama}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-rose-500"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {AUDIT_FIELDS.map((field) => {
                const isEmpty =
                  !selectedAlumni[field] ||
                  selectedAlumni[field].toString().trim() === "";
                return (
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
                          disabled={status === "Match" && isEmpty}
                          onClick={() => handleAuditChange(field, status)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${
                            auditData[field] === status
                              ? status === "Match"
                                ? "bg-emerald-500 text-white"
                                : status === "Miss"
                                  ? "bg-rose-500 text-white"
                                  : "bg-slate-600 text-white"
                              : "text-slate-400 hover:text-slate-600"
                          } ${status === "Match" && isEmpty ? "opacity-20 cursor-not-allowed" : ""}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                onClick={saveManualAudit}
                className="bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase hover:bg-indigo-700 transition"
              >
                Simpan Audit
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase hover:bg-slate-200 transition"
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
