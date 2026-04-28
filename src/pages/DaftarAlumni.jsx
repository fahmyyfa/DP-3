import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Search, Briefcase } from "lucide-react";
import StatWidgets from "../components/StatWidgets";
import AddAlumniForm from "../components/AddAlumniForm";

const DaftarAlumni = () => {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 25;

  const [globalStats, setGlobalStats] = useState({
    total: 142292,
    tracked_count: 0,
    highAccuracy: 0,
    avg_fields: 0,
    audit_match: 0,
  });

  const [distributionData, setDistributionData] = useState({
    lessThanTwo: 0,
    twoFields: 0,
    threeFields: 0,
    fourFields: 0,
  });

  useEffect(() => {
    fetchAlumni();
  }, [page]);

  async function fetchAlumni() {
    setLoading(true);
    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      let query = supabase.from("alumni").select("*");
      if (searchTerm) {
        query = query.or(
          `nama.ilike.%${searchTerm}%,nim.ilike.%${searchTerm}%`,
        );
      }

      const { data: listData, error: listError } = await query
        .order("auto_score", { ascending: false })
        .range(from, to);

      if (listError) throw listError;
      setAlumniList(listData || []);

      const { count: totalPop } = await supabase
        .from("alumni")
        .select("*", { count: "exact", head: true });
      const { count: trackedInd } = await supabase
        .from("alumni")
        .select("*", { count: "exact", head: true })
        .not("status_pelacakan", "ilike", "%Belum Dilacak%");

      const { count: idnInd } = await supabase
        .from("alumni")
        .select("*", { count: "exact", head: true })
        .ilike("status_pelacakan", "%Teridentifikasi%");

      const { data: distData, error: distError } = await supabase
        .from("alumni_field_distribution")
        .select("*");

      let avg = 0;
      if (!distError && distData) {
        const dist = {
          lessThanTwo: distData.filter((d) => d.filled_fields_count < 2).length,
          twoFields: distData.filter((d) => d.filled_fields_count === 2).length,
          threeFields: distData.filter((d) => d.filled_fields_count === 3)
            .length,
          fourFields: distData.filter((d) => d.filled_fields_count === 4)
            .length,
        };
        setDistributionData(dist);
        avg =
          distData.length > 0
            ? (
                distData.reduce(
                  (acc, curr) => acc + curr.filled_fields_count,
                  0,
                ) / distData.length
              ).toFixed(1)
            : 0;
      }

      const { count: auditMatchCount } = await supabase
        .from("alumni")
        .select("*", { count: "exact", head: true })
        .gt("manual_score", 0);

      setGlobalStats({
        total: totalPop || 142292,
        tracked_count: trackedInd || 0,
        highAccuracy: idnInd || 0,
        avg_fields: avg,
        audit_match: auditMatchCount || 0,
      });
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const getFoundDataCount = (alumni) => {
    const fields = ["linkedin_url", "tempat_kerja", "posisi", "alamat_kerja"];
    return fields.filter((f) => alumni[f] && alumni[f] !== "").length;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900">
            Dashboard Pelacakan
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            Monitoring data alumni Universitas Muhammadiyah Malang
          </p>
        </div>
        <button
          onClick={() => {
            setPage(0);
            fetchAlumni();
          }}
          className="bg-white border border-slate-200 p-2.5 px-5 rounded-xl font-bold hover:bg-slate-50 transition text-sm"
        >
          Refresh Data
        </button>
      </header>

      <StatWidgets stats={globalStats} distributionData={distributionData} />

      <AddAlumniForm onAdded={fetchAlumni} />

      <div className="flex gap-4 mb-6 mt-10">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Cari Nama atau NIM Alumni..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAlumni()}
          />
        </div>
        <button
          onClick={() => {
            setPage(0);
            fetchAlumni();
          }}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold"
        >
          Cari Data
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="p-5">Informasi Alumni</th>
              <th className="p-5 text-center">Detail Data</th>
              <th className="p-5 text-center">Status</th>
              <th className="p-5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-20 text-center text-slate-400">
                  Memproses data...
                </td>
              </tr>
            ) : (
              alumniList.map((alumni) => (
                <tr
                  key={alumni.id}
                  className="hover:bg-slate-50/80 transition group"
                >
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-base">
                        {alumni.nama}
                      </span>
                      <span className="text-slate-400 text-xs font-semibold">
                        {alumni.nim} • {alumni.prodi}
                      </span>
                      {alumni.posisi && (
                        <span className="text-indigo-600 text-[11px] font-bold mt-1 flex items-center gap-1">
                          <Briefcase size={12} /> {alumni.posisi}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex flex-wrap justify-center gap-1.5 max-w-[200px] mx-auto">
                      {alumni.linkedin_url && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase">
                          Linkedin
                        </span>
                      )}
                      {alumni.posisi && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase">
                          Posisi
                        </span>
                      )}
                      {alumni.alamat_kerja && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] font-bold uppercase">
                          Lokasi
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${alumni.status_pelacakan?.includes("SerpApi") ? "bg-green-100 text-green-700" : "bg-sky-100 text-sky-700"}`}
                    >
                      {alumni.status_pelacakan}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <button className="p-2 px-4 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase hover:bg-indigo-600">
                      Lacak
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Hal {page + 1} • {globalStats.total.toLocaleString()} Alumni
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="p-2 px-4 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={
                (page + 1) * ITEMS_PER_PAGE >= globalStats.total || loading
              }
              className="p-2 px-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaftarAlumni;
