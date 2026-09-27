import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';

/**
 * Einfacher Markdown-zu-PDF-Renderer für Dokumente des KI-Assistenten
 * (Businessplan, Finanzierungskonzept, Projektbeschrieb). Unterstützt Titel
 * (#, ##, ###), Absätze, Aufzählungen (-, *, 1.) und fette Zeilen (**…**).
 * Tabellen werden zeilenweise als Text ausgegeben. Gestaltung nach der
 * Präsentation: Ink für Titel, Petrol für Akzente, Helvetica als Standardschrift.
 */

const INK = rgb(14 / 255, 34 / 255, 51 / 255);
const PETROL = rgb(31 / 255, 168 / 255, 140 / 255);
const MUTED = rgb(92 / 255, 107 / 255, 119 / 255);
const BODY = rgb(20 / 255, 24 / 255, 28 / 255);

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - 2 * MARGIN;

/** Zeichen ausserhalb von WinAnsi (Standardschriften) ersetzen. */
function sanitize(text: string): string {
  return text
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/\u2713|\u2714/g, 'ja')
    .replace(/\u2717|\u2718/g, 'nein')
    .replace(/[\u2028\u2029]/g, ' ')
    .replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/g, '?');
}

function stripInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/(^|\s)[*_](\S.*?\S|\S)[*_](?=\s|$|[.,;:])/g, '$1$2');
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // Sehr lange Wörter hart trennen
      if (font.widthOfTextAtSize(word, size) > width) {
        let chunk = '';
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, size) > width) {
            lines.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        current = chunk;
      } else current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

type Block =
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'p'; text: string; bold?: boolean }
  | { kind: 'li'; text: string; marker: string }
  | { kind: 'gap' };

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r/g, '').split('\n');
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) {
      const text = paragraph.join(' ');
      const bold = /^\*\*[^*]+\*\*$/.test(text.trim());
      blocks.push({ kind: 'p', text: stripInline(text), bold });
      paragraph = [];
    }
  };
  let ordered = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      ordered = 0;
      if (blocks.length && blocks[blocks.length - 1].kind !== 'gap') blocks.push({ kind: 'gap' });
      continue;
    }
    if (/^---+$/.test(trimmed) || /^\|?\s*:?-{2,}/.test(trimmed)) continue; // Trennlinien, Tabellenkopf-Trenner
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      flush();
      blocks.push({ kind: h[1].length === 1 ? 'h1' : h[1].length === 2 ? 'h2' : 'h3', text: stripInline(h[2]) });
      continue;
    }
    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      flush();
      blocks.push({ kind: 'li', text: stripInline(bullet[1]), marker: '•' });
      continue;
    }
    const num = /^(\d+)[.)]\s+(.*)$/.exec(trimmed);
    if (num) {
      flush();
      ordered += 1;
      blocks.push({ kind: 'li', text: stripInline(num[2]), marker: `${num[1]}.` });
      continue;
    }
    if (trimmed.startsWith('|')) {
      flush();
      const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
      blocks.push({ kind: 'li', text: stripInline(cells.join('   ·   ')), marker: '' });
      continue;
    }
    paragraph.push(trimmed);
  }
  flush();
  return blocks;
}

export async function markdownToPdf(params: {
  title: string;
  subtitle?: string;
  markdown: string;
  footer: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(sanitize(params.title));
  doc.setProducer('LIQUODA');
  doc.setCreator('LIQUODA KI-Assistent');
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const footer = sanitize(params.footer);

  const drawFooter = (p: PDFPage) => {
    p.drawLine({ start: { x: MARGIN, y: MARGIN - 14 }, end: { x: MARGIN + 60, y: MARGIN - 14 }, thickness: 1.2, color: PETROL });
    p.drawText(footer, { x: MARGIN, y: MARGIN - 28, size: 7.5, font: regular, color: MUTED, maxWidth: CONTENT_W - 60 });
  };
  const newPage = () => {
    drawFooter(page);
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };
  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 10) newPage();
  };
  const drawLines = (lines: string[], font: PDFFont, size: number, color = BODY, x = MARGIN, lineHeight = size * 1.45) => {
    for (const line of lines) {
      ensure(lineHeight);
      page.drawText(sanitize(line), { x, y: y - size, size, font, color });
      y -= lineHeight;
    }
  };

  // Titelblock
  page.drawText('LIQUODA', { x: MARGIN, y: y - 9, size: 9, font: bold, color: PETROL });
  y -= 22;
  drawLines(wrap(sanitize(params.title), bold, 22, CONTENT_W), bold, 22, INK, MARGIN, 27);
  if (params.subtitle) {
    y -= 2;
    drawLines(wrap(sanitize(params.subtitle), regular, 10.5, CONTENT_W), regular, 10.5, MUTED);
  }
  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + 70, y }, thickness: 2, color: PETROL });
  y -= 22;

  for (const block of parse(params.markdown)) {
    switch (block.kind) {
      case 'gap':
        y -= 6;
        break;
      case 'h1':
        ensure(40);
        y -= 10;
        drawLines(wrap(sanitize(block.text), bold, 15, CONTENT_W), bold, 15, INK, MARGIN, 20);
        y -= 4;
        break;
      case 'h2':
        ensure(34);
        y -= 8;
        drawLines(wrap(sanitize(block.text), bold, 12.5, CONTENT_W), bold, 12.5, INK, MARGIN, 17);
        y -= 3;
        break;
      case 'h3':
        ensure(28);
        y -= 5;
        drawLines(wrap(sanitize(block.text), bold, 10.5, CONTENT_W), bold, 10.5, PETROL, MARGIN, 15);
        y -= 2;
        break;
      case 'p':
        drawLines(wrap(sanitize(block.text), block.bold ? bold : regular, 10, CONTENT_W), block.bold ? bold : regular, 10);
        y -= 4;
        break;
      case 'li': {
        const indent = block.marker ? 16 : 0;
        const lines = wrap(sanitize(block.text), regular, 10, CONTENT_W - indent);
        ensure(14.5);
        if (block.marker) page.drawText(sanitize(block.marker), { x: MARGIN + 2, y: y - 10, size: 10, font: regular, color: PETROL });
        drawLines(lines, regular, 10, BODY, MARGIN + indent);
        y -= 1;
        break;
      }
    }
  }
  drawFooter(page);

  // Seitenzahlen
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const label = `${i + 1} / ${pages.length}`;
    p.drawText(label, { x: PAGE_W - MARGIN - regular.widthOfTextAtSize(label, 7.5), y: MARGIN - 28, size: 7.5, font: regular, color: MUTED });
  });

  return doc.save();
}
