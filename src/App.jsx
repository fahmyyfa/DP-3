import { useEffect, useState } from "react";
import { calculateScore } from "./lib/scoringLogic";
import AddAlumniForm from "./components/AddAlumniForm";
import Login from "./components/Login";
import { supabase } from "./lib/supabaseClient";
import {
  Users,
  ShieldCheck,
  Search,
  CheckCircle,
  LogOut,
  ChevronRight,
  Database,
  Globe,
  Briefcase,
} from "lucide-react";
import AuditDashboard from "./pages/AuditDashboard";

function App() {
  const [session, setSession] = useState(null);
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    tracked: 0,
    highAccuracy: 0,
  });
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 25;
  const [activeTab, setActiveTab] = useState("daftar");

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync Data
  useEffect(() => {
    if (session) fetchAlumni();
  }, [session, page]);

  async function fetchAlumni() {
    setLoading(true);
    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      // 1. List Data
      // Ganti bagian query di fungsi fetchAlumni() dalam App.jsx
      const { data: listData } = await supabase
        .from("alumni")
        .select("*")
        // PRIORITAS UTAMA: Jumlah data terbanyak (11 -> 0)
        .order("found_count", { ascending: false })
        // PRIORITAS KEDUA: Data yang paling baru diupdate
        .order("updated_at", { ascending: false })
        .range(from, to);

      // 2. Total Count
      const { count: totalData } = await supabase
        .from("alumni")
        .select("*", { count: "exact", head: true });

      // 3. Coverage Count
      const { count: totalTracked } = await supabase
        .from("alumni")
        .select("*", { count: "exact", head: true })
        .not("status_pelacakan", "eq", "Belum Dilacak");

      // 4. Quality Count
      const { count: totalIdentified } = await supabase
        .from("alumni")
        .select("*", { count: "exact", head: true })
        .ilike("status_pelacakan", "%Teridentifikasi%");

      if (listData) setAlumniList(listData);
      setGlobalStats({
        total: totalData || 0,
        tracked: totalTracked || 0,
        highAccuracy: totalIdentified || 0,
      });
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const getFoundDataCount = (alumni) => {
    const fields = [
      "linkedin_url",
      "instagram_url",
      "facebook_url",
      "tiktok_url",
      "email",
      "no_hp",
      "tempat_kerja",
      "alamat_kerja",
      "posisi",
    ];
    return fields.filter((f) => alumni[f] && alumni[f] !== "").length;
  };

  async function handleLogout() {
    await supabase.signOut();
    setSession(null);
  }

  if (!session) return <Login onLoginSuccess={setSession} />;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* --- SIDEBAR FIXED --- */}
      <div className="w-64 bg-slate-900 text-white p-6 fixed h-full flex flex-col justify-between shadow-2xl z-50">
        <div>
          <h1 className="text-xl font-bold mb-10 flex items-center gap-2 text-indigo-400">
            <Search size={24} /> SPAO Admin
          </h1>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("daftar")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition ${
                activeTab === "daftar"
                  ? "bg-indigo-600 shadow-lg shadow-indigo-500/20"
                  : "hover:bg-slate-800"
              } text-sm`}
            >
              <Users size={20} /> Daftar Alumni
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition ${
                activeTab === "audit"
                  ? "bg-green-600 shadow-lg shadow-green-500/20"
                  : "hover:bg-slate-800"
              } text-sm`}
            >
              <ShieldCheck size={20} /> Audit Mode
            </button>
          </nav>
        </div>
        <div className="pt-6 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition text-sm font-bold"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 ml-64 p-10">
        {/* ================= TAB DAFTAR ALUMNI ================= */}
        {activeTab === "daftar" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-slate-900">
                  Dashboard Pelacakan
                </h2>
                <p className="text-slate-500 font-medium">
                  Monitoring data alumni Universitas Muhammadiyah Malang
                </p>
              </div>
              <button
                onClick={fetchAlumni}
                className="bg-white border border-slate-200 p-2.5 px-5 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm text-sm"
              >
                Refresh
              </button>
            </header>

            {/* Widget Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Database size={24} />
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase">
                    Database Utama
                  </span>
                </div>
                <h4 className="text-3xl font-black text-slate-900">
                  {globalStats.total.toLocaleString()}
                </h4>
                <p className="text-slate-500 text-sm font-medium">
                  Total Alumni di Sistem
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Globe size={24} />
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase">
                    Coverage
                  </span>
                </div>
                <h4 className="text-3xl font-black text-slate-900">
                  {globalStats.tracked.toLocaleString()}
                  <span className="text-sm text-slate-400 font-normal ml-2">
                    (
                    {globalStats.total > 0
                      ? (
                          (globalStats.tracked / globalStats.total) *
                          100
                        ).toFixed(2)
                      : 0}
                    %)
                  </span>
                </h4>
                <p className="text-slate-500 text-sm font-medium">
                  Individu Berhasil Dilacak
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <CheckCircle size={24} />
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase">
                    Data Quality
                  </span>
                </div>
                <h4 className="text-3xl font-black text-slate-900">
                  {globalStats.highAccuracy.toLocaleString()}
                </h4>
                <p className="text-slate-500 text-sm font-medium">
                  Status Teridentifikasi
                </p>
              </div>
            </div>

            <AddAlumniForm onAdded={fetchAlumni} />

            {/* Tabel Utama */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mt-10">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider">
                      Informasi Alumni
                    </th>
                    <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">
                      Detail Data
                    </th>
                    <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-20 text-center text-slate-400 font-medium"
                      >
                        Menghubungkan ke server...
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
                              <span className="text-indigo-600 text-xs font-bold mt-1 flex items-center gap-1">
                                <Briefcase size={12} /> {alumni.posisi}{" "}
                                {alumni.tempat_kerja
                                  ? `at ${alumni.tempat_kerja}`
                                  : ""}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* --- REVISI: DISPLAY CHIPS DATA LENGKAP --- */}
                        <td className="p-5">
                          <div className="flex flex-wrap justify-center gap-1.5 max-w-[250px] mx-auto">
                            {alumni.linkedin_url && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold border border-blue-100 uppercase">
                                Linkedin
                              </span>
                            )}
                            {alumni.instagram_url && (
                              <span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded-md text-[9px] font-bold border border-pink-100 uppercase">
                                Instagram
                              </span>
                            )}
                            {alumni.facebook_url && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-bold border border-indigo-100 uppercase">
                                Facebook
                              </span>
                            )}
                            {alumni.tiktok_url && (
                              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[9px] font-bold border border-slate-100 uppercase">
                                Tiktok
                              </span>
                            )}
                            {alumni.email && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[9px] font-bold border border-red-100 uppercase">
                                Email
                              </span>
                            )}
                            {alumni.no_hp && (
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[9px] font-bold border border-green-100 uppercase">
                                WA/Telp
                              </span>
                            )}
                            {alumni.posisi && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-bold border border-emerald-100 uppercase">
                                Posisi
                              </span>
                            )}
                            {alumni.tempat_kerja && (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[9px] font-bold border border-purple-100 uppercase">
                                Kantor
                              </span>
                            )}
                            {alumni.alamat_kerja && (
                              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[9px] font-bold border border-slate-100 uppercase">
                                Lokasi
                              </span>
                            )}

                            {/* Tampilan jika benar-benar kosong */}
                            {getFoundDataCount(alumni) === 0 && (
                              <span className="text-[10px] text-slate-300 italic">
                                No public data found
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                alumni.status_pelacakan.includes(
                                  "Teridentifikasi",
                                )
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {alumni.status_pelacakan}
                            </span>
                            {getFoundDataCount(alumni) > 0 && (
                              <span className="text-[10px] font-bold text-indigo-500">
                                +{getFoundDataCount(alumni)} Atribut
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <button className="p-2 px-4 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase hover:bg-indigo-600 transition">
                            Lacak
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Pagination */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Hal {page + 1} • {globalStats.total.toLocaleString()} Alumni
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 px-4 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * ITEMS_PER_PAGE >= globalStats.total}
                    className="p-2 px-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB AUDIT MODE ================= */}
        {activeTab === "audit" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AuditDashboard />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
