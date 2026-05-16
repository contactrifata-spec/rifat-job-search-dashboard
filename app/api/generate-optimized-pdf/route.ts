import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

function wrapText(text: string, font: import("pdf-lib").PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    try {
      const w = font.widthOfTextAtSize(testLine, fontSize);
      if (w <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    } catch {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    const originalSummary = (formData.get("originalSummary") as string) ?? "";
    const optimizedSummary = (formData.get("optimizedSummary") as string) ?? "";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!optimizedSummary) return NextResponse.json({ error: "No optimized summary" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // ── Step 1: Extract text positions via pdfjs-dist ──────────────────────
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const uint8 = new Uint8Array(buffer);
    const pdfDoc = await pdfjsLib.getDocument({ data: uint8, useWorkerFetch: false, isEvalSupported: false }).promise;
    const page = await pdfDoc.getPage(1);
    const { height: pdfPageHeight } = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const items: TextItem[] = (textContent.items as TextItem[]).filter((i) => i.str.trim().length > 0);

    // ── Step 2: Find summary bounding box ─────────────────────────────────
    // Build cumulative text to locate where the summary starts
    let cumText = "";
    const itemMeta: Array<{ idx: number; start: number; end: number; x: number; y: number; h: number }> = [];
    for (let i = 0; i < items.length; i++) {
      const start = cumText.length;
      cumText += items[i].str;
      itemMeta.push({
        idx: i,
        start,
        end: cumText.length,
        x: items[i].transform[4],
        y: items[i].transform[5],
        h: items[i].height || Math.abs(items[i].transform[3]) || 10,
      });
    }

    // Match by the first 40 chars of summary (robust to minor whitespace diffs)
    const needle = originalSummary.replace(/\s+/g, "").toLowerCase().slice(0, 40);
    const haystack = cumText.replace(/\s+/g, "").toLowerCase();
    const needlePos = haystack.indexOf(needle);

    let summaryTopY: number | null = null;
    let summaryBottomY: number | null = null;
    let summaryX = 72; // fallback
    let summaryFontSize = 10;

    if (needlePos !== -1) {
      // Find items that overlap with the summary region in cumText
      const summaryEndPos = needlePos + originalSummary.replace(/\s+/g, "").length;
      const involved = itemMeta.filter((m) => m.start <= summaryEndPos && m.end >= needlePos);
      if (involved.length > 0) {
        const ys = involved.map((m) => m.y);
        summaryBottomY = Math.min(...ys);
        summaryTopY = Math.max(...ys) + (involved[0].h || 10);
        summaryX = Math.min(...involved.map((m) => m.x));
        summaryFontSize = involved[0].h || 10;
      }
    }

    // Fallback: estimate from page layout if matching failed
    if (summaryTopY === null) {
      summaryTopY = pdfPageHeight - 130;
      summaryBottomY = pdfPageHeight - 190;
      summaryFontSize = 10;
    }

    // ── Step 3: Modify PDF with pdf-lib ───────────────────────────────────
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
    const pdfLibDoc = await PDFDocument.load(buffer);
    const pdfPage = pdfLibDoc.getPages()[0];
    const { width: pageWidth } = pdfPage.getSize();

    const marginLeft = summaryX;
    const marginRight = 72;
    const textAreaWidth = pageWidth - marginLeft - marginRight;
    const fontSize = summaryFontSize;
    const lineHeight = fontSize * 1.35;

    // Embed a standard font that closely matches body text (Helvetica ≈ Arial/Calibri)
    const font = await pdfLibDoc.embedFont(StandardFonts.Helvetica);

    // Calculate how tall the new summary will be
    const newLines = wrapText(optimizedSummary, font, fontSize, textAreaWidth);
    const newHeight = newLines.length * lineHeight + fontSize;

    // Determine the rectangle to white out — use whichever is taller
    const oldHeight = summaryTopY! - summaryBottomY!;
    const rectHeight = Math.max(oldHeight, newHeight) + fontSize * 2;
    const rectY = summaryTopY! - rectHeight;

    // White out the old summary area
    pdfPage.drawRectangle({
      x: marginLeft - 4,
      y: rectY,
      width: textAreaWidth + 8,
      height: rectHeight + fontSize,
      color: rgb(1, 1, 1),
    });

    // Draw the optimized summary text
    let currentY = summaryTopY! - fontSize;
    for (const line of newLines) {
      pdfPage.drawText(line, {
        x: marginLeft,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    }

    const modifiedBytes = await pdfLibDoc.save();

    return new NextResponse(modifiedBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ATS_Optimized_Resume.pdf"`,
      },
    });
  } catch (err) {
    console.error("generate-optimized-pdf error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
