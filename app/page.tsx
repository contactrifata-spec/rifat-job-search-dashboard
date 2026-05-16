import { Hero } from "@/components/ui/animated-hero";
import JobSearchGuide from "@/components/job-search-guide";
import ResumeOptimizer from "@/components/resume-optimizer";
import ApplicationTracker from "@/components/application-tracker";

export default function Home() {
  return (
    <main>
      <Hero />
      <JobSearchGuide />
      <ResumeOptimizer />
      <ApplicationTracker />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 px-4 text-center">
        <p className="text-slate-600 text-xs">
          Rifat Ahmed · Greater Toronto Area ·{" "}
          <a href="mailto:rifatahmed.work@outlook.com" className="text-blue-500 hover:underline">
            rifatahmed.work@outlook.com
          </a>{" "}
          ·{" "}
          <a href="https://www.linkedin.com/in/rifat-ahmed5/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            LinkedIn
          </a>
        </p>
      </footer>
    </main>
  );
}
