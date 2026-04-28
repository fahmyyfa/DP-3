import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar"; // Pastikan titik satu
import DaftarAlumni from "./pages/DaftarAlumni";
import AuditDashboard from "./pages/AuditDashboard";

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("daftar");

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session),
    );
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (!session) return <Login onLoginSuccess={setSession} />;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="flex-1 ml-64 p-10">
        {activeTab === "daftar" ? <DaftarAlumni /> : <AuditDashboard />}
      </div>
    </div>
  );
}

export default App;
