const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","are","was","were","be","been","being","have","has","had","do",
  "does","did","will","would","should","could","may","might","must","shall",
  "we","you","they","it","he","she","that","this","these","those","i","me",
  "my","your","our","their","its","what","which","who","when","where","why",
  "how","all","each","every","both","few","more","most","other","some","such",
  "than","too","very","just","about","also","if","so","then","though","while",
  "yet","because","since","although","unless","however","therefore","thus",
  "can","able","need","get","use","make","take","work","help","as","not",
  "into","over","after","before","during","through","up","out","between",
]);

export interface KeywordResult {
  term: string;
  count: number;
  inResume: boolean;
}

export function extractJDKeywords(jdText: string): KeywordResult[] {
  const lower = jdText.toLowerCase().replace(/[^\w\s+#.-]/g, " ");
  const words = lower.split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

  // Single-word frequency
  const freq: Record<string, number> = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });

  // Bigrams (two-word phrases)
  const rawWords = lower.split(/\s+/);
  for (let i = 0; i < rawWords.length - 1; i++) {
    const w1 = rawWords[i].replace(/[^\w]/g, "");
    const w2 = rawWords[i + 1].replace(/[^\w]/g, "");
    if (w1.length > 2 && w2.length > 2 && !STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
      const phrase = `${w1} ${w2}`;
      freq[phrase] = (freq[phrase] || 0) + 0.5; // slightly lower weight for bigrams
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([term, count]) => ({ term, count, inResume: false }));
}

export function calculateATSScore(resumeText: string, keywords: KeywordResult[]): number {
  if (!keywords.length) return 0;
  const lower = resumeText.toLowerCase();
  const top20 = keywords.slice(0, 20);
  const matches = top20.filter((k) => lower.includes(k.term));
  return Math.round((matches.length / top20.length) * 100);
}

export function markKeywordsInResume(resumeText: string, keywords: KeywordResult[]): KeywordResult[] {
  const lower = resumeText.toLowerCase();
  return keywords.map((k) => ({ ...k, inResume: lower.includes(k.term) }));
}

export function optimizeSummary(originalSummary: string, keywords: KeywordResult[]): string {
  const missing = keywords
    .filter((k) => !k.inResume && k.term.length > 3 && !k.term.includes(" "))
    .slice(0, 8)
    .map((k) => k.term);

  const missingPhrases = keywords
    .filter((k) => !k.inResume && k.term.includes(" "))
    .slice(0, 3)
    .map((k) => k.term);

  if (!missing.length && !missingPhrases.length) return originalSummary;

  let optimized = originalSummary;

  // Strategy 1: Expand tool mentions (e.g. "tools like X, Y" → "tools like X, Y, and Z")
  const toolsRegex = /(tools like|using|leveraging|including|such as)\s+([^.]+?)(\.|,\s+and\s+[A-Z])/gi;
  if (missing.length > 0 && toolsRegex.test(optimized)) {
    const top = missing.slice(0, 3).join(", ");
    optimized = optimized.replace(toolsRegex, (match, prefix, list, suffix) => {
      return `${prefix} ${list.trim()}, ${top}${suffix}`;
    });
    missing.splice(0, 3);
  }

  // Strategy 2: Inject missing skills into "Proven track record in X" or similar
  const trackRegex = /(Proven track record in|Experienced in|Background in)\s+([^.]+?)\./i;
  const trackMatch = optimized.match(trackRegex);
  if (trackMatch && missing.length > 0) {
    const addition = `, ${missing.slice(0, 2).join(", ")}`;
    optimized = optimized.replace(trackRegex, (match) => match.replace(".", `${addition}.`));
    missing.splice(0, 2);
  }

  // Strategy 3: Append a skills sentence for any remaining
  const remaining = [...missing, ...missingPhrases].slice(0, 5);
  if (remaining.length > 0) {
    const skillStr = remaining.join(", ");
    const lastDot = optimized.lastIndexOf(".");
    if (lastDot !== -1) {
      optimized =
        optimized.slice(0, lastDot + 1) +
        ` Demonstrated expertise includes ${skillStr} to deliver high-impact results.`;
    }
  }

  return optimized;
}

export function parseResumeSections(fullText: string): {
  header: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  rest: string;
} {
  const lines = fullText.split("\n");
  let section = "header";
  const sections: Record<string, string[]> = {
    header: [],
    summary: [],
    skills: [],
    experience: [],
    education: [],
    rest: [],
  };

  const sectionMap: Record<string, string> = {
    "skills": "skills",
    "certifications": "skills",
    "skills & certifications": "skills",
    "work experience": "experience",
    "experience": "experience",
    "education": "education",
  };

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    const matched = Object.keys(sectionMap).find((k) => lower === k || lower.startsWith(k));
    if (matched) {
      section = sectionMap[matched];
      continue;
    }
    // First non-empty lines after header and before a known section = summary
    if (section === "header" && line.trim() && !sections.header.length) {
      section = "header";
    }
    // Detect summary paragraph (multi-word lines before SKILLS section)
    if (section === "header" && sections.header.length >= 2 && line.trim().length > 40) {
      section = "summary";
    }
    if (sections[section] !== undefined) {
      sections[section].push(line);
    } else {
      sections.rest.push(line);
    }
  }

  return {
    header: sections.header.join("\n"),
    summary: sections.summary.join("\n"),
    skills: sections.skills.join("\n"),
    experience: sections.experience.join("\n"),
    education: sections.education.join("\n"),
    rest: sections.rest.join("\n"),
  };
}
