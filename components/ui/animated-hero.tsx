"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Project Manager", "Marketing Ops Pro", "AML Analyst", "Business Analyst"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2200);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex gap-6 py-20 lg:py-32 items-center justify-center flex-col">
          {/* Pill badge */}
          <a href="#optimizer" className="no-underline">
            <Button variant="secondary" size="sm" className="gap-3 text-xs font-semibold tracking-wide uppercase">
              New: ATS Resume Optimizer <MoveRight className="w-3 h-3" />
            </Button>
          </a>

          {/* Main heading */}
          <div className="flex gap-3 flex-col items-center">
            <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tighter text-center font-semibold text-white">
              <span className="text-spektr-cyan-50 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Rifat Ahmed
              </span>
              <span className="block text-slate-300 text-3xl md:text-4xl font-normal mt-2 mb-1">
                Job Search Command Center
              </span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 min-h-[1.2em]">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold text-blue-400"
                    initial={{ opacity: 0, y: -80 }}
                    transition={{ type: "spring", stiffness: 60, damping: 14 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : { y: titleNumber > index ? -120 : 120, opacity: 0 }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-base md:text-lg leading-relaxed tracking-tight text-slate-400 max-w-2xl text-center mt-2">
              PMP®-certified · BComm, Toronto Metropolitan University · Greater Toronto Area
              <br />
              Targeting hybrid &amp; remote roles · Minimum $60,000 · 4 tailored resumes ready
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-row gap-3 flex-wrap justify-center">
            <a href="#search-guide">
              <Button size="lg" className="gap-3 bg-blue-600 hover:bg-blue-700 text-white">
                <Search className="w-4 h-4" /> Find Jobs
              </Button>
            </a>
            <a href="#optimizer">
              <Button size="lg" variant="outline" className="gap-3">
                Optimize Resume <MoveRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-4 flex-wrap justify-center">
            {[
              { label: "Resume Versions", value: "4" },
              { label: "Job Boards Linked", value: "5" },
              { label: "Min. Salary", value: "$60K" },
              { label: "Work Type", value: "Remote / Hybrid" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
