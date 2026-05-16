"use client";
import { useState } from "react";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

interface App {
  id: number;
  company: string;
  title: string;
  resume: string;
  wtype: string;
  salary: string;
  date: string;
  status: string;
  url: string;
  notes: string;
}

const STATUS_STYLES: Record<string, string> = {
  Applied:       "bg-blue-900/40 text-blue-300 border-blue-800",
  "Phone Screen":"bg-purple-900/40 text-purple-300 border-purple-800",
  Interview:     "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  "Offer 🎉":    "bg-orange-900/40 text-orange-300 border-orange-800",
  Rejected:      "bg-red-900/40 text-red-300 border-red-800",
};

const RESUME_STYLES: Record<string, string> = {
  PM:   "bg-blue-900/40 text-blue-300 border-blue-800",
  Mktg: "bg-purple-900/40 text-purple-300 border-purple-800",
  AML:  "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  BSA:  "bg-amber-900/40 text-amber-300 border-amber-800",
};

const RESUME_LABELS: Record<string, string> = {
  PM: "📊 PM", Mktg: "📣 Mktg", AML: "🔒 AML", BSA: "💻 BSA",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${MONTHS[+m - 1]} ${+day}, ${y}`;
}

export default function ApplicationTracker() {
  const [apps, setApps] = useState<App[]>([]);
  const [form, setForm] = useState({
    company: "", title: "", resume: "PM", wtype: "Remote",
    salary: "", date: "2026-05-15", status: "Applied", url: "", notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function add() {
    if (!form.company.trim() || !form.title.trim()) {
      alert("Company name and job title are required.");
      return;
    }
    setApps((prev) => [...prev, { ...form, id: Date.now() }]);
    setForm((f) => ({ ...f, company: "", title: "", salary: "", url: "", notes: "" }));
  }

  function remove(id: number) {
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  const counts = {
    total: apps.length,
    phone: apps.filter((a) => a.status === "Phone Screen").length,
    interview: apps.filter((a) => a.status === "Interview").length,
    offer: apps.filter((a) => a.status === "Offer 🎉").length,
    rejected: apps.filter((a) => a.status === "Rejected").length,
  };

  const Input = ({ id, placeholder, className = "" }: { id: keyof typeof form; placeholder: string; className?: string }) => (
    <input
      value={form[id]}
      onChange={(e) => set(id, e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500 transition-colors ${className}`}
    />
  );

  const Select = ({ id, options }: { id: keyof typeof form; options: string[] }) => (
    <select
      value={form[id]}
      onChange={(e) => set(id, e.target.value)}
      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <section id="tracker" className="bg-slate-950 py-16 px-4 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <ClipboardList className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Application Tracker</h2>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {[
            { label: "Applied", val: counts.total, color: "text-blue-400" },
            { label: "Phone Screen", val: counts.phone, color: "text-purple-400" },
            { label: "Interviewing", val: counts.interview, color: "text-emerald-400" },
            { label: "Offers", val: counts.offer, color: "text-orange-400" },
            { label: "Rejected", val: counts.rejected, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 rounded-xl border border-slate-800 p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add form */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-5">+ Log New Application</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Company *</label><Input id="company" placeholder="e.g. Scotiabank" /></div>
            <div><label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Job Title *</label><Input id="title" placeholder="e.g. Project Manager" /></div>
            <div><label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Resume Used</label><Select id="resume" options={["PM","Mktg","AML","BSA"]} /></div>
            <div><label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Work Type</label><Select id="wtype" options={["Remote","Hybrid"]} /></div>
            <div><label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Salary Range</label><Input id="salary" placeholder="e.g. $70K–$85K" /></div>
            <div><label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Date Applied</label><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors" /></div>
            <div><label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Status</label><Select id="status" options={["Applied","Phone Screen","Interview","Offer 🎉","Rejected"]} /></div>
            <div><label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Job URL</label><Input id="url" placeholder="Paste link" /></div>
          </div>
          <div className="mb-4"><label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Notes</label><Input id="notes" placeholder="Referred by contact · Follow up Friday · Deadline next week" /></div>
          <Button onClick={add} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add to Tracker
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr>
                  {["#","Company","Role","Resume","Type","Salary","Date","Status","Notes","Link",""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-14 text-slate-600">
                      <div className="text-3xl mb-2">📭</div>
                      <p className="text-sm">No applications yet — log your first one above!</p>
                    </td>
                  </tr>
                ) : (
                  apps.map((a, i) => (
                    <tr key={a.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-3 text-slate-600 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{a.company}</td>
                      <td className="px-4 py-3 text-slate-400">{a.title}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${RESUME_STYLES[a.resume] || ""}`}>{RESUME_LABELS[a.resume] || a.resume}</span></td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${a.wtype === "Remote" ? "bg-emerald-900/30 text-emerald-300 border-emerald-800" : "bg-indigo-900/30 text-indigo-300 border-indigo-800"}`}>{a.wtype === "Remote" ? "🌐 Remote" : "🏢 Hybrid"}</span></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{a.salary || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmtDate(a.date)}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_STYLES[a.status] || ""}`}>{a.status}</span></td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[160px] truncate">{a.notes || "—"}</td>
                      <td className="px-4 py-3">{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline">View ↗</a> : "—"}</td>
                      <td className="px-4 py-3"><button onClick={() => remove(a.id)} className="text-slate-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
