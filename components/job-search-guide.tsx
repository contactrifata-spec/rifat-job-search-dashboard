"use client";
import { useState } from "react";
import { ExternalLink, Lightbulb, Target, Building2 } from "lucide-react";

const JOBS = {
  pm: {
    label: "📊 Project Management",
    color: "blue",
    accent: "text-blue-400",
    border: "border-blue-500/30",
    activeBg: "bg-blue-600",
    titles: [
      "Project Manager",
      "Agile Project Manager",
      "Program Manager",
      "IT Project Manager",
      "Digital Transformation Project Manager",
      "Senior Project Coordinator",
      "PMO Analyst",
      "Associate Program Manager",
    ],
    tips: [
      { icon: "🏆", text: "Lead with PMP® in your LinkedIn headline — recruiters filter by it directly." },
      { icon: "🎯", text: 'Use "Mid-Senior level" filter on LinkedIn to skip coordinator roles under $60K.' },
      { icon: "🏦", text: "Best industries: Fintech, Telecom, Banking, Insurance, SaaS, Consulting." },
      { icon: "🤝", text: "Target: Deloitte, KPMG, CGI, Bell, TD, Scotiabank, Manulife, IBM, Accenture." },
      { icon: "🔑", text: 'Power keywords: "Agile", "Scrum", "stakeholder management", "JIRA", "PMBOK", "Power BI".' },
      { icon: "💰", text: "GTA salary range: $70K–$100K. Your Rogers + Advantage + PMP story targets the higher end." },
    ],
  },
  mktg: {
    label: "📣 Marketing & Ops",
    color: "purple",
    accent: "text-purple-400",
    border: "border-purple-500/30",
    activeBg: "bg-purple-600",
    titles: [
      "Marketing Operations Manager",
      "Marketing Operations Specialist",
      "Campaign Manager",
      "Digital Marketing Manager",
      "Marketing Program Manager",
      "CRM Marketing Specialist",
      "Email Marketing Manager",
      "Operations & Marketing Analyst",
    ],
    tips: [
      { icon: "🚀", text: "Salesforce + Power BI + HTML email automation is a rare and in-demand combo." },
      { icon: "🎬", text: "UGC Creator experience is a plus for DTC and e-commerce companies — lead with it." },
      { icon: "🏦", text: "Best industries: SaaS, E-commerce, Financial Services, Media agencies, Retail." },
      { icon: "🤝", text: "Target: Shopify, Wealthsimple, HubSpot partners, CIBC, RBC Digital, Hootsuite." },
      { icon: "🔑", text: 'Keywords: "marketing automation", "demand gen", "CRM", "email campaigns", "Google Analytics".' },
      { icon: "💰", text: "Marketing Ops at SaaS companies in Canada typically pays $65K–$90K." },
    ],
  },
  aml: {
    label: "🔒 AML / Compliance",
    color: "emerald",
    accent: "text-emerald-400",
    border: "border-emerald-500/30",
    activeBg: "bg-emerald-600",
    titles: [
      "AML Analyst",
      "KYC Analyst",
      "Compliance Analyst",
      "Financial Crime Analyst",
      "Risk & Compliance Analyst",
      "AML / KYC Specialist",
      "Compliance Officer",
      "Fraud Risk Analyst",
    ],
    tips: [
      { icon: "🏆", text: "RBC + Questrade are credible regulated institutions — name both prominently." },
      { icon: "📜", text: "CAMS certification would unlock $80K+ roles — consider pursuing it soon." },
      { icon: "🏦", text: "Best employers: Big 5 banks, credit unions, IIROC members, FINTRAC, insurance cos." },
      { icon: "🤝", text: "Target: TD, BMO, Scotiabank, CIBC, Deloitte Risk, KPMG Forensics, Interac." },
      { icon: "🔑", text: 'Keywords: "FINTRAC", "OSFI", "AML/ATF", "KYC due diligence", "suspicious transaction".' },
      { icon: "💰", text: "AML Analyst at Big 5 banks in GTA: $65K–$85K. Your IIROC experience is a differentiator." },
    ],
  },
  bsa: {
    label: "💻 Business Systems",
    color: "amber",
    accent: "text-amber-400",
    border: "border-amber-500/30",
    activeBg: "bg-amber-600",
    titles: [
      "Business Systems Analyst",
      "Business Analyst",
      "IT Business Analyst",
      "Systems Analyst",
      "Process Improvement Analyst",
      "Salesforce Business Analyst",
      "Business Intelligence Analyst",
      "ERP Business Analyst (SAP / Oracle)",
    ],
    tips: [
      { icon: "🏆", text: "Oracle Fusion/SAP cert + PMP is rare at your level — lead with this combo." },
      { icon: "⚙️", text: "VBA Macros cutting cycle time 15% is a strong quantified achievement — use it everywhere." },
      { icon: "🏦", text: "Best industries: Consulting, Financial Services, Telecom, Healthcare IT, Government tech." },
      { icon: "🤝", text: "Target: Accenture, IBM, CGI, Capgemini, Cognizant, Scotiabank IT, Rogers IT." },
      { icon: "🔑", text: 'Keywords: "requirements gathering", "user stories", "Salesforce", "ERP", "UAT", "Power Query".' },
      { icon: "💰", text: "BSA at consulting firms in Toronto: $70K–$95K. Excellent upside with your certifications." },
    ],
  },
};

const BOARDS = [
  { label: "LinkedIn", color: "bg-blue-700 hover:bg-blue-600", buildUrl: (t: string) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(t)}&location=Canada&f_WT=2%2C3` },
  { label: "Indeed", color: "bg-slate-700 hover:bg-slate-600", buildUrl: (t: string) => `https://ca.indeed.com/jobs?q=${encodeURIComponent(t)}&l=Remote` },
  { label: "Glassdoor", color: "bg-emerald-800 hover:bg-emerald-700", buildUrl: (t: string) => `https://www.glassdoor.ca/Job/jobs.htm?sc.keyword=${encodeURIComponent(t)}&locT=N&locId=3` },
  { label: "Monster", color: "bg-violet-800 hover:bg-violet-700", buildUrl: (t: string) => `https://www.monster.ca/jobs/search?q=${encodeURIComponent(t)}&where=Remote` },
  { label: "Job Bank", color: "bg-red-900 hover:bg-red-800", buildUrl: (t: string) => `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=${encodeURIComponent(t)}` },
];

type TabKey = keyof typeof JOBS;

export default function JobSearchGuide() {
  const [active, setActive] = useState<TabKey>("pm");
  const tab = JOBS[active];

  return (
    <section id="search-guide" className="bg-slate-950 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-8">
          <Target className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Job Search by Resume</h2>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-8 p-1.5 bg-slate-900 rounded-xl border border-slate-800 w-fit flex-wrap">
          {(Object.keys(JOBS) as TabKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                active === key
                  ? `${JOBS[key].activeBg} text-white shadow-lg`
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {JOBS[key].label}
            </button>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Job titles — 3 cols */}
          <div className={`lg:col-span-3 bg-slate-900 rounded-2xl border ${tab.border} p-6`}>
            <div className={`text-xs font-bold uppercase tracking-widest mb-5 ${tab.accent}`}>
              Search These Titles — Click a Board to Open
            </div>
            <div className="space-y-2.5">
              {tab.titles.map((title) => (
                <div
                  key={title}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <span className="text-slate-200 text-sm font-medium flex-1">→ {title}</span>
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                    {BOARDS.map((b) => (
                      <a
                        key={b.label}
                        href={b.buildUrl(title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${b.color} text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 transition-colors`}
                      >
                        {b.label} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`bg-slate-900 rounded-2xl border ${tab.border} p-6`}>
              <div className={`text-xs font-bold uppercase tracking-widest mb-5 ${tab.accent} flex items-center gap-2`}>
                <Lightbulb className="w-3.5 h-3.5" /> Strategy & Tips
              </div>
              <ul className="space-y-0">
                {tab.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex gap-3 py-3 border-b border-slate-800 last:border-b-0 last:pb-0"
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{tip.icon}</span>
                    <span className="text-slate-400 text-[13px] leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: tip.text.replace(/"([^"]+)"/g, '<strong class="text-slate-200">$1</strong>'),
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Quick Company Search</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["LinkedIn Jobs", "Indeed CA", "Glassdoor CA", "Job Bank CA", "Workopolis"].map((site, i) => {
                  const urls = [
                    "https://www.linkedin.com/jobs/",
                    "https://ca.indeed.com",
                    "https://www.glassdoor.ca/Job/index.htm",
                    "https://www.jobbank.gc.ca/jobsearch/",
                    "https://www.workopolis.com",
                  ];
                  return (
                    <a
                      key={site}
                      href={urls[i]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
                    >
                      {site} ↗
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
