import { useEffect, useState } from "react";
import { calculateScore } from "./lib/scoringLogic";
import { supabase } from "./lib/supabaseClient";
import {
  Users,
  ShieldCheck,
  Settings,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

function App() {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState(null); // Alumni yang sedang ditinjau
  const [evidence, setEvidence] = useState(null); // Bukti dari tabel tracking_evidence

  useEffect(() => {
    fetchAlumni();
  }, []);

  // --- FUNGSI DATA ---

  async function fetchAlumni() {
    setLoading(true);
    const { data } = await supabase
      .from("alumni")
      .select("*")
      .order("nama", { ascending: true });

    if (data) setAlumniList(data);
    setLoading(false);
  }

  // --- FUNGSI AUTOMATIC TRACKING (UC-3 & UC-4) ---

  async function runTracking(alumni) {
    // Simulasi Data temuan dari Sumber Publik [cite: 217]
    const mockFoundData = {
      name: alumni.nama,
      description: `Alumni Informatika UMM angkatan ${alumni.tahun_lulus - 4}. Bekerja sebagai Software Engineer di Tech Corp.`,
      url: "https://linkedin.com/in/dummy-profile",
    };

    // Hitung Skor menggunakan logika pembobotan [cite: 220]
    const finalScore = calculateScore(alumni, mockFoundData);
    let newStatus = "Tidak Ditemukan";

    // Ambang Batas (Threshold) sesuai rancangan [cite: 142-143, 220]
    if (finalScore >= 0.75) newStatus = "Teridentifikasi";
    else if (finalScore >= 0.5) newStatus = "Perlu Verifikasi Manual";

    // 1. Update Status di Tabel Alumni [cite: 257, 262]
    await supabase
      .from("alumni")
      .update({ status_pelacakan: newStatus })
      .eq("id", alumni.id);

    // 2. Simpan Bukti ke Tabel Evidence [cite: 207, 259]
    await supabase.from("tracking_evidence").insert([
      {
        alumni_id: alumni.id,
        url_sumber: mockFoundData.url,
        snippet_data: mockFoundData.description,
        confidence_score: finalScore,
      },
    ]);

    alert(`Pelacakan selesai! Skor: ${finalScore} -> Status: ${newStatus}`);
    fetchAlumni(); // Segarkan tampilan dashboard
  }

  // --- FUNGSI VERIFIKASI MANUAL (UC-5) ---

  async function viewEvidence(alumni) {
    setSelectedAlumni(alumni);
    const { data } = await supabase
      .from("tracking_evidence")
      .select("*")
      .eq("alumni_id", alumni.id)
      .order("created_at", { ascending: false }) // Ambil bukti terbaru
      .limit(1);

    if (data && data.length > 0) {
      setEvidence(data[0]);
    } else {
      alert("Belum ada bukti pelacakan. Silakan klik 'Lacak' terlebih dahulu.");
      setSelectedAlumni(null);
    }
  }

  async function handleDecision(id, isApproved) {
    const newStatus = isApproved ? "Teridentifikasi" : "Tidak Cocok";

    const { error } = await supabase
      .from("alumni")
      .update({ status_pelacakan: newStatus })
      .eq("id", id);

    if (!error) {
      alert(`Status berhasil diperbarui menjadi: ${newStatus}`);
      setSelectedAlumni(null); // Tutup modal
      fetchAlumni(); // Segarkan tabel
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 fixed h-full">
        <h1 className="text-xl font-bold mb-10 flex items-center gap-2 text-indigo-400">
          <Search size={24} /> SPAO Admin
        </h1>
        <nav className="space-y-4">
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-indigo-600 rounded-lg"
          >
            <Users size={20} /> Daftar Alumni
          </a>
          <a
            href="#"
            className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg text-slate-400"
          >
            <ShieldCheck size={20} /> Verifikasi Hasil
          </a>
          <a
            href="#"
            className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg text-slate-400"
          >
            <Settings size={20} /> Konfigurasi
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-10">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Daftar Alumni</h2>
            <p className="text-slate-500">
              Pantau status pelacakan otomatis secara real-time.
            </p>
          </div>
          <button
            onClick={fetchAlumni}
            className="bg-white border border-slate-200 p-2 px-4 rounded-lg shadow-sm hover:bg-slate-50 transition font-medium"
          >
            Refresh Data
          </button>
        </header>

        {/* Statistik */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm mb-1 font-medium">
              Total Alumni
            </p>
            <p className="text-3xl font-bold">{alumniList.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-green-600 text-sm mb-1 font-medium">
              Teridentifikasi
            </p>
            <p className="text-3xl font-bold text-green-600">
              {
                alumniList.filter(
                  (a) => a.status_pelacakan === "Teridentifikasi",
                ).length
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-amber-600 text-sm mb-1 font-medium">
              Perlu Verifikasi
            </p>
            <p className="text-3xl font-bold text-amber-600">
              {
                alumniList.filter(
                  (a) => a.status_pelacakan === "Perlu Verifikasi Manual",
                ).length
              }
            </p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-700">NIM</th>
                <th className="p-4 font-semibold text-slate-700">
                  Nama Lengkap
                </th>
                <th className="p-4 font-semibold text-slate-700">Prodi</th>
                <th className="p-4 font-semibold text-slate-700">
                  Status Pelacakan
                </th>
                <th className="p-4 font-semibold text-slate-700 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : (
                alumniList.map((alumni) => (
                  <tr
                    key={alumni.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition"
                  >
                    <td className="p-4 font-mono text-sm text-slate-500">
                      {alumni.nim}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {alumni.nama}
                    </td>
                    <td className="p-4 text-slate-600">{alumni.prodi}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                          alumni.status_pelacakan === "Teridentifikasi"
                            ? "bg-green-100 text-green-700"
                            : alumni.status_pelacakan ===
                                "Perlu Verifikasi Manual"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {alumni.status_pelacakan === "Teridentifikasi" ? (
                          <CheckCircle size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        {alumni.status_pelacakan}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-4">
                      <button
                        onClick={() => runTracking(alumni)}
                        className="text-indigo-600 hover:text-indigo-900 font-bold text-sm"
                      >
                        Lacak
                      </button>
                      <button
                        onClick={() => viewEvidence(alumni)}
                        className="text-slate-400 hover:text-slate-700 font-bold text-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Verifikasi Manual (UC-5) */}
      {selectedAlumni && evidence && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Verifikasi Manual
                </h3>
                <p className="text-slate-500 text-sm">
                  Alumni:{" "}
                  <span className="font-bold text-slate-800">
                    {selectedAlumni.nama}
                  </span>
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                Skor: {evidence.confidence_score}
              </span>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl mb-8 border border-slate-200">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 text-indigo-500">
                Bukti Temuan (Snippet)
              </p>
              <p className="italic text-slate-700 leading-relaxed mb-4">
                "{evidence.snippet_data}"
              </p>
              <a
                href={evidence.url_sumber}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1"
              >
                Lihat Profil Sumber ↗
              </a>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDecision(selectedAlumni.id, true)}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
              >
                Setujui (Valid)
              </button>
              <button
                onClick={() => handleDecision(selectedAlumni.id, false)}
                className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition"
              >
                Tolak (Salah)
              </button>
              <button
                onClick={() => setSelectedAlumni(null)}
                className="px-4 text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
