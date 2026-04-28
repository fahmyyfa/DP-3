import React from "react";
import { Search, Users, ShieldCheck, LogOut } from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <div className="w-64 bg-slate-900 text-white p-6 fixed h-full flex flex-col justify-between shadow-2xl z-50">
      <div>
        <h1 className="text-xl font-bold mb-10 flex items-center gap-2 text-indigo-400">
          <Search size={24} /> SPAO Admin
        </h1>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("daftar")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition text-sm ${
              activeTab === "daftar"
                ? "bg-indigo-600 shadow-lg shadow-indigo-500/20"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <Users size={20} /> Daftar Alumni
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition text-sm ${
              activeTab === "audit"
                ? "bg-green-600 shadow-lg shadow-green-500/20"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <ShieldCheck size={20} /> Audit Mode
          </button>
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition text-sm font-bold"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
