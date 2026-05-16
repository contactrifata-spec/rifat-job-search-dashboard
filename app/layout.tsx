import type { Metadata } from "next";
import "./globals.css";

const inter = { className: "font-sans" };

export const metadata: Metadata = {
  title: "Rifat Ahmed — Job Search Dashboard",
  description: "PMP®-certified professional · Remote & Hybrid roles · Min. $60K · ATS Resume Optimizer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
