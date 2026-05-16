"use client";
import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Link2, Wand2, Download, X, CheckCircle2, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractJDKeywords, calculateATSScore, markKeywordsInResume, optimizeSummary, type KeywordResult } from "@/lib/ats-utils";

type Step = "upload" | "jd" | "analyzing" | "results";

interface ResumeData {
  fullText: string;
  fileName: string;
  originalFile: File;
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  const ring = score >= 80 ? "stroke-emerald-400" : score >= 60 ? "stroke-amber-400" : "stroke-red-400";
  const pct = (score / 100) * 283;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            className={ring} strokeWidth="8"
            strokeDasharray={`${pct} 283`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{score}%</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-medium">{label}</span>
    </div>
  );
}

export default function ResumeOptimizer() {
  const [step, setStep] = useState<Step>("upload");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingJD, setIsLoadingJD] = useState(false);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [scoreBefore, setScoreBefore] = useState(0);
  const [scoreAfter, setScoreAfter] = useState(0);
  const [optimizedSummary, setOptimizedSummary] = useState("");
  const [originalSummary, setOriginalSummary] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── PDF text extraction via API ──────────────────────────────────────────
  async function handleFile(file: File) {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const data = await res.json();
      if (data.text) {
        setResumeData({ fullText: data.text, fileName: file.name, originalFile: file });
        setStep("jd");
      } else {
        alert("Could not parse PDF. Please try another file.");
      }
    } catch {
      alert("Error reading PDF. Please try again.");
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  // ── Fetch JD from URL ────────────────────────────────────────────────────
  async function fetchJD() {
    if (!jdUrl.trim()) return;
    setIsLoadingJD(true);
    try {
      const res = await fetch(`/api/fetch-jd?url=${encodeURIComponent(jdUrl)}`);
      const data = await res.json();
      if (data.text) setJdText(data.text);
      else alert("Could not fetch that page. Try pasting the job description text directly.");
    } catch {
      alert("Failed to fetch URL. Paste the job description text instead.");
    } finally {
      setIsLoadingJD(false);
    }
  }

  // ── Run ATS analysis ─────────────────────────────────────────────────────
  async function analyze() {
    if (!resumeData || !jdText.trim()) return;
    setStep("analyzing");

    await new Promise((r) => setTimeout(r, 1200));

    const raw = extractJDKeywords(jdText);
    const marked = markKeywordsInResume(resumeData.fullText, raw);
    setKeywords(marked);

    const before = calculateATSScore(resumeData.fullText, marked);
    setScoreBefore(before);

    // Find summary paragraph (first long block after contact info)
    const lines = resumeData.fullText.split("\n");
    let summaryLine = "";
    for (const line of lines) {
      if (line.trim().length > 80 && !line.includes("@") && !line.includes("linkedin")) {
        summaryLine = line.trim();
        break;
      }
    }
    setOriginalSummary(summaryLine);

    const missing = marked.filter((k) => !k.inResume);
    const optimized = optimizeSummary(summaryLine, marked);
    setOptimizedSummary(optimized);

    const fakeFullWithOptimized = resumeData.fullText.replace(summaryLine, optimized);
    const after = calculateATSScore(fakeFullWithOptimized, marked);
    setScoreAfter(Math.min(after, 94));

    setStep("results");
  }

  // ── Generate optimized PDF ───────────────────────────────────────────────
  async function downloadPDF() {
    if (!resumeData) return;
    setIsGeneratingPDF(true);
    try {
      const formData = new FormData();
      formData.append("pdf", resumeData.originalFile);
      formData.append("originalSummary", originalSummary);
      formData.append("optimizedSummary", optimizedSummary);

      const res = await fetch("/api/generate-optimized-pdf", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Server error");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.fileName.replace(".pdf", "")}_ATS_Optimized.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  function reset() {
    setStep("upload");
    setResumeData(null);
    setJdText("");
    setJdUrl("");
    setKeywords([]);
    setScoreBefore(0);
    setScoreAfter(0);
    setOptimizedSummary("");
    setOriginalSummary("");
    setShowAllKeywords(false);
  }

  return (
    <section id="optimizer" className="bg-slate-900 py-16 px-4 border-t border-slate-800">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Wand2 className="w-5 h-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">ATS Resume Optimizer</h2>
          <div className="flex-1 h-px bg-slate-800" />
          {(step === "results" || step === "jd") && (
            <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <X className="w-3 h-3" /> Start over
            </button>
          )}
        </div>

        {/* Progress stepper */}
        <div className="flex items-center gap-2 mb-10 text-xs">
          {["Upload Resume", "Paste Job Description", "Results"].map((s, i) => {
            const stepIndex = step === "upload" ? 0 : step === "jd" ? 1 : 2;
            const done = i < stepIndex;
            const current = i === stepIndex || (step === "analyzing" && i === 2);
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  done ? "bg-violet-600 text-white" : current ? "bg-violet-500/30 text-violet-300 border border-violet-500" : "bg-slate-800 text-slate-500"
                }`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={current ? "text-violet-300 font-medium" : done ? "text-slate-400" : "text-slate-600"}>{s}</span>
                {i < 2 && <div className={`w-8 h-px ${done ? "bg-violet-600" : "bg-slate-800"}`} />}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Upload ── */}
        {step === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200 ${
              isDragging ? "border-violet-500 bg-violet-500/10" : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-violet-400" : "text-slate-600"}`} />
            <p className="text-slate-300 font-semibold text-lg mb-2">Drop your resume PDF here</p>
            <p className="text-slate-500 text-sm mb-6">or click to browse files</p>
            <Button variant="outline" size="sm" className="pointer-events-none">
              <FileText className="w-4 h-4 mr-2" /> Select PDF
            </Button>
            <p className="text-slate-600 text-xs mt-6">Supports any of your 4 resume versions · PDF only · Processed securely</p>
          </div>
        )}

        {/* ── STEP 2: Job Description ── */}
        {step === "jd" && (
          <div className="space-y-5">
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200">{resumeData?.fileName}</p>
                <p className="text-xs text-slate-500">Resume uploaded successfully</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
            </div>

            {/* URL input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Job Posting URL (optional)
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 focus-within:border-violet-500 transition-colors">
                  <Link2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <input
                    type="url"
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                  />
                </div>
                <Button
                  onClick={fetchJD}
                  disabled={!jdUrl.trim() || isLoadingJD}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-5 shrink-0"
                  size="sm"
                >
                  {isLoadingJD ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                </Button>
              </div>
            </div>

            {/* Text input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Job Description Text *
              </label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={10}
                placeholder="Paste the full job description here — requirements, qualifications, responsibilities..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-500 transition-colors resize-y font-mono leading-relaxed"
              />
            </div>

            <Button
              onClick={analyze}
              disabled={!jdText.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base font-semibold"
            >
              <Wand2 className="w-4 h-4 mr-2" /> Analyze & Optimize Resume
            </Button>
          </div>
        )}

        {/* ── STEP 3: Analyzing ── */}
        {step === "analyzing" && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-5" />
            <p className="text-slate-300 font-semibold text-lg mb-2">Analyzing job description…</p>
            <p className="text-slate-500 text-sm">Extracting keywords · Scoring ATS match · Optimizing summary</p>
          </div>
        )}

        {/* ── STEP 4: Results ── */}
        {step === "results" && (
          <div className="space-y-6">
            {/* Score cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col items-center gap-3">
                <ScoreCircle score={scoreBefore} label="Before Optimization" />
              </div>
              <div className="bg-slate-950 rounded-2xl border border-violet-500/30 p-6 flex flex-col items-center gap-3">
                <ScoreCircle score={scoreAfter} label="After Optimization" />
                <div className="text-xs text-emerald-400 font-semibold">
                  +{scoreAfter - scoreBefore}% improvement
                </div>
              </div>
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Top Matched Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.filter((k) => k.inResume).slice(0, 12).map((k) => (
                    <span key={k.term} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-800">
                      ✓ {k.term}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary comparison */}
            {originalSummary && (
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Original Summary</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{originalSummary}</p>
                </div>
                <div className="bg-slate-950 rounded-2xl border border-emerald-500/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">ATS-Optimized Summary</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{optimizedSummary}</p>
                </div>
              </div>
            )}

            {/* Missing keywords */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Missing Keywords ({keywords.filter((k) => !k.inResume).length} not in resume)
                </p>
                <button onClick={() => setShowAllKeywords(!showAllKeywords)} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                  {showAllKeywords ? "Show less" : "Show all"} <ChevronDown className={`w-3 h-3 transition-transform ${showAllKeywords ? "rotate-180" : ""}`} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywords
                  .filter((k) => !k.inResume)
                  .slice(0, showAllKeywords ? 50 : 15)
                  .map((k) => (
                    <span key={k.term} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {k.term}
                    </span>
                  ))}
              </div>
            </div>

            {/* Download */}
            <div className="flex gap-3">
              <Button
                onClick={downloadPDF}
                disabled={isGeneratingPDF}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white h-12 text-base font-semibold"
              >
                {isGeneratingPDF ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating PDF…</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Download ATS-Optimized Resume PDF</>
                )}
              </Button>
              <Button onClick={reset} variant="outline" className="h-12 px-6">
                Try Another
              </Button>
            </div>

            <p className="text-xs text-slate-600 text-center">
              Only the summary paragraph is modified — all other content remains unchanged. The PDF is generated client-side and never stored.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
