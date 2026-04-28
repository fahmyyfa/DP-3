import React, { useState } from "react";
import {
  Database,
  Globe,
  CheckCircle,
  ListChecks,
  ShieldCheck,
  X,
} from "lucide-react";

const StatWidgets = ({ stats, distributionData }) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
        <StatCard
          icon={<Database />}
          label="Total Alumni"
          val={stats.total}
          color="indigo"
        />
        <StatCard
          icon={<Globe />}
          label="Total Dilacak"
          val={stats.tracked_count}
          color="green"
        />
        <StatCard
          icon={<CheckCircle />}
          label="Teridentifikasi"
          val={stats.highAccuracy}
          color="blue"
        />

        <div
          onClick={() => setShowDetail(true)}
          className="cursor-pointer group"
        >
          <StatCard
            icon={<ListChecks className="group-hover:scale-110 transition" />}
            label="Rata-rata Kelengkapan"
            val={stats.avg_fields || "2.4"}
            sub="Poin Field"
            color="purple"
            isExtra
          />
        </div>

        <StatCard
          icon={<ShieldCheck />}
          label="Audit Match"
          val={stats.audit_match || "0"}
          color="emerald"
        />
      </div>

      {showDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowDetail(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Detail Kelengkapan
            </h3>
            <p className="text-slate-500 text-sm mb-6 font-medium">
              Distribusi pengisian 4 poin data utama
            </p>

            <div className="space-y-4">
              <ProgressBar
                label="< 2 Field Terisi"
                val={distributionData.lessThanTwo}
                total={stats.tracked_count}
                color="bg-red-500"
              />
              <ProgressBar
                label="2 Field Terisi"
                val={distributionData.twoFields}
                total={stats.tracked_count}
                color="bg-orange-500"
              />
              <ProgressBar
                label="3 Field Terisi"
                val={distributionData.threeFields}
                total={stats.tracked_count}
                color="bg-blue-500"
              />
              <ProgressBar
                label="4 Field Terisi"
                val={distributionData.fourFields}
                total={stats.tracked_count}
                color="bg-emerald-500"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const StatCard = ({ icon, label, val, color, sub, isExtra }) => (
  <div
    className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-${color}-300 transition-all`}
  >
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2.5 bg-${color}-50 text-${color}-600 rounded-xl`}>
        {icon}
      </div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </span>
    </div>
    <h4 className="text-2xl font-black text-slate-900">
      {val?.toLocaleString()}
    </h4>
    <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-tight">
      {sub || "Individu"}
    </p>
    {isExtra && (
      <p className="text-indigo-600 text-[9px] font-black mt-2">
        Klik untuk Detail →
      </p>
    )}
  </div>
);

const ProgressBar = ({ label, val, total, color }) => {
  const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] font-black uppercase mb-1.5 tracking-tight">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900">
          {val?.toLocaleString()} ({percent}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatWidgets;
