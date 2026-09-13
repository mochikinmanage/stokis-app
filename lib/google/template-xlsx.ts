// lib/google/template-xlsx.ts
// Baca template .xlsx lokal → isi data dengan ExcelJS → return buffer.
// Semua formatting template (font, warna, border, merged cells, column widths) dipertahankan.

import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import type { XlsxItem, XlsxReportInput } from '@/lib/domain/xlsx-report';
import { XLSX_FONT } from '@/lib/domain/xlsx-report';
import { parseThreshold } from '@/lib/domain/so';

const TEMPLATE_PATH = path.join(process.cwd(), 'Templates', 'PREVIEW SO FORMAT REPORTS (1).xlsx');

function formatDateShort(date: string | number | null | undefined): string {
  const v = normalizeDate(date);
  if (!v) return '-';
  const day = String(v.getUTCDate()).padStart(2, '0');
  const month = String(v.getUTCMonth() + 1).padStart(2, '0');
  const year = v.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeDate(date: string | number | null | undefined): Date | null {
  if (date == null || date === '') return null;
  if (typeof date === 'number' && Number.isFinite(date)) {
    const ms = Math.round((date - 25569) * 86400000);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms);
  }
  const s = String(date).trim();
  if (/^\d{5,6}$/.test(s)) {
    const ms = Math.round((Number(s) - 25569) * 86400000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
  if (m) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isUtilitasBoolean(it: XlsxItem): boolean {
  return (it.tipeInput || '').toLowerCase().includes('boolean');
}

function isUtilitasNumeric(it: XlsxItem): boolean {
  const t = (it.tipeInput || '').toLowerCase();
  return t.includes('single') || t.includes('dual');
}

function regularStatus(s1: number, s2: number, threshold: number | null): string {
  const total = s1 + s2;
  if (threshold == null || threshold <= 0) return '—';
  if (total <= threshold) return '🔴 KRITIS';
  if (total <= threshold * 2) return '🟠 HAMPIR HABIS';
  return '🟢 AMAN';
}

function utilTokenStatus(prevS2: string | number | null | undefined, threshold: number | null): string {
  const val = Number(prevS2) || 0;
  if (threshold == null || threshold <= 0) return '—';
  if (val <= threshold) return '🔴 KRITIS';
  if (val <= threshold * 2) return '🟠 HAMPIR HABIS';
  return '🟢 AMAN';
}

/** Status sort rank: 0=KRITIS, 1=HAMPIR HABIS, 2=AMAN, 3=— */
function regularStatusRank(s1: number, s2: number, threshold: number | null): number {
  const total = s1 + s2;
  if (threshold == null || threshold <= 0) return 3;
  if (total <= threshold) return 0;
  if (total <= threshold * 2) return 1;
  return 2;
}

function utilgasStatusRank(statusIsi: string): number {
  const s = (statusIsi || '').toLowerCase();
  if (s === 'habis') return 0;
  if (s === 'dipakai') return 1;
  if (s === 'penuh') return 2;
  return 3;
}

function utiltokenStatusRank(prevS2: string | number | null | undefined, threshold: number | null): number {
  const val = Number(prevS2) || 0;
  if (threshold == null || threshold <= 0) return 3;
  if (val <= threshold) return 0;
  if (val <= threshold * 2) return 1;
  return 2;
}

/**
 * Generate XLSX dari template lokal → isi data dengan ExcelJS → return buffer.
 */
export async function generateXlsxFromTemplate(
  input: XlsxReportInput
): Promise<{ buffer: Buffer; fileName: string }> {
  // ── Build file name ───────────────────────────────────────────────
  const kode = (input.cabangKode || 'CBG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const d = normalizeDate(input.tanggalOperasional);
  const tgl = d
    ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`
    : String(input.tanggalOperasional || '');
  const shiftLabel = (input.shift || 'SO').toUpperCase();
  const petugasLabel = String(input.petugas || 'Petugas').replace(/[/\\:*?"<>|]/g, '').trim();
  const fileName = `${kode} - ${tgl} - ${shiftLabel} - ${petugasLabel}.xlsx`;

  // ── 1. Read template from local file ──────────────────────────────
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);

  // ── 2. Open with ExcelJS ─────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(templateBuffer as any);
  const ws = wb.getWorksheet('SO DETAILS') || wb.worksheets[0];
  if (!ws) throw new Error('Sheet SO DETAILS tidak ditemukan di template');

  // ── 3. Separate items ──────────────────────────────────────────
  const regularItems: XlsxItem[] = [];
  const utilitasBoolean: XlsxItem[] = [];
  const utilitasNumeric: XlsxItem[] = [];

  input.items.forEach((it) => {
    if (isUtilitasBoolean(it)) {
      utilitasBoolean.push(it);
    } else if (isUtilitasNumeric(it) && (it.area || '').toLowerCase().includes('utilitas')) {
      utilitasNumeric.push(it);
    } else {
      regularItems.push(it);
    }
  });

  // ── 4. Build data rows (pre-sorted per block) ─────────────────
  const currTgl = formatDateShort(input.tanggalOperasional);
  const prevTgl = formatDateShort(input.previousSOInfo?.tanggal);
  const prevShift = input.previousSOInfo?.shift || '-';
  const prevPetugas = input.previousSOInfo?.petugas || '-';
  const cabangLabel = input.cabangKode + ' (' + input.cabangNama + ')';

  interface DataRow {
    type: 'divider' | 'subheader' | 'item' | 'utilgas' | 'utiltoken' | 'note';
    no?: number;
    nama?: string;
    satuan?: string;
    threshold?: number | string;
    prevS1?: number | string | null;
    prevS2?: number | string | null;
    prevTotal?: number | string | null;
    s1?: number;
    s2?: number;
    keterangan?: string;
    areaName?: string;
    statusIsi?: string;
    tglRefill?: string;
    tglPakai?: string;
    noteText?: string;
  }

  interface Block {
    name: string;
    items: DataRow[];
    headerType: 'regular' | 'utilgas' | 'utiltoken';
  }

  // Group regular items by area
  const groupMode = input.groupMode === 'Area' ? 'Area' : 'Urutan_Input';
  const groups: Array<{ area?: string; items: XlsxItem[] }> = [];

  if (groupMode === 'Area') {
    const byArea = new Map<string, XlsxItem[]>();
    regularItems.forEach((it) => {
      const key = (it.area || '').trim() || 'Area Umum';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key)!.push(it);
    });
    byArea.forEach((items, area) => groups.push({ area, items }));
  } else {
    groups.push({ items: regularItems });
  }

  // Build area blocks with pre-sorting
  const blocks: Block[] = [];
  let globalNo = 0;

  groups.forEach((group) => {
    const blockItems: DataRow[] = [];

    // Pre-sort by status rank
    const sorted = [...group.items].sort((a, b) => {
      const aTh = parseThreshold(a.threshold);
      const bTh = parseThreshold(b.threshold);
      const aRank = regularStatusRank(Number(a.step1) || 0, Number(a.step2) || 0, aTh);
      const bRank = regularStatusRank(Number(b.step1) || 0, Number(b.step2) || 0, bTh);
      return aRank - bRank;
    });

    sorted.forEach((it) => {
      globalNo++;
      const s1 = Number(it.step1) || 0;
      const s2 = Number(it.step2) || 0;
      const threshold = parseThreshold(it.threshold);
      const thresholdVal = threshold != null ? threshold : '';
      const p1 = it.prevStep1 != null && it.prevStep1 !== '' ? Number(it.prevStep1) : null;
      const p2 = it.prevStep2 != null && it.prevStep2 !== '' ? Number(it.prevStep2) : null;
      const prevTotal = (p1 != null || p2 != null)
        ? (p1 || 0) + (p2 || 0)
        : (it.prevTotal != null && it.prevTotal !== '' ? Number(it.prevTotal) : null);

      blockItems.push({
        type: 'item', no: globalNo, nama: it.namaBarang, satuan: it.satuan,
        threshold: thresholdVal, prevS1: p1, prevS2: p2, prevTotal,
        s1, s2, keterangan: it.keterangan,
      });
    });

    blocks.push({ name: group.area || 'Area', items: blockItems, headerType: 'regular' });
  });

  // Utilitas blocks — Gas first, then Token, then Minyak
  // Split boolean items into gas vs minyak by name keyword
  const isMinyak = (it: XlsxItem) => /\bminyak|oil\b/i.test(it.namaBarang || '');
  const utilGasItems = utilitasBoolean.filter(it => !isMinyak(it));
  const utilMinyakItems = utilitasBoolean.filter(it => isMinyak(it));

  if (utilGasItems.length > 0) {
    const blockItems: DataRow[] = [];
    const sorted = [...utilGasItems].sort((a, b) =>
      utilgasStatusRank(a.statusIsi || '') - utilgasStatusRank(b.statusIsi || '')
    );
    sorted.forEach((it) => {
      globalNo++;
      const threshold = parseThreshold(it.threshold);
      blockItems.push({
        type: 'utilgas', no: globalNo, nama: it.namaBarang, satuan: it.satuan,
        threshold: threshold != null ? threshold : '',
        statusIsi: it.statusIsi || '', tglRefill: it.tglRefill, tglPakai: it.tglPakai,
        keterangan: it.keterangan,
      });
    });
    blocks.push({ name: 'Utilitas Gas', items: blockItems, headerType: 'utilgas' });
  }

  if (utilitasNumeric.length > 0) {
    const blockItems: DataRow[] = [];
    const sorted = [...utilitasNumeric].sort((a, b) => {
      const aTh = parseThreshold(a.threshold);
      const bTh = parseThreshold(b.threshold);
      return utiltokenStatusRank(a.prevStep2, aTh) - utiltokenStatusRank(b.prevStep2, bTh);
    });
    sorted.forEach((it) => {
      globalNo++;
      const threshold = parseThreshold(it.threshold);
      const p1 = it.prevStep1 != null && it.prevStep1 !== '' ? Number(it.prevStep1) : null;
      blockItems.push({
        type: 'utiltoken', no: globalNo, nama: it.namaBarang, satuan: it.satuan,
        threshold: threshold != null ? threshold : '',
        prevS1: p1, prevS2: it.prevStep2, tglRefill: it.tglRefill, tglPakai: it.tglPakai,
        keterangan: it.keterangan,
      });
    });
    blocks.push({ name: 'Utilitas Token', items: blockItems, headerType: 'utiltoken' });
  }

  if (utilMinyakItems.length > 0) {
    const blockItems: DataRow[] = [];
    const sorted = [...utilMinyakItems].sort((a, b) =>
      utilgasStatusRank(a.statusIsi || '') - utilgasStatusRank(b.statusIsi || '')
    );
    sorted.forEach((it) => {
      globalNo++;
      const threshold = parseThreshold(it.threshold);
      blockItems.push({
        type: 'utilgas', no: globalNo, nama: it.namaBarang, satuan: it.satuan,
        threshold: threshold != null ? threshold : '',
        statusIsi: it.statusIsi || '', tglRefill: it.tglRefill, tglPakai: it.tglPakai,
        keterangan: it.keterangan,
      });
    });
    blocks.push({ name: 'Utilitas Minyak', items: blockItems, headerType: 'utilgas' });
  }

  const note = String(input.note || '').trim();

  // ── 5. Update header rows (rows 1-5) ────────────────────────────
  ws.getCell('E1').value = `LAPORAN STOCK OPNAME HARIAN ${input.cabangNama.toUpperCase()}`;
  ws.getCell('E1').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.title.size, color: { argb: 'FF000000' } } as any;
  ws.getCell('E2').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.info.size, color: { argb: 'FF000000' } } as any;
  ws.getCell('H2').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.info.size, color: { argb: 'FF000000' } } as any;
  ws.getCell('A3').value = cabangLabel;
  ws.getCell('C3').value = currTgl;
  ws.getCell('D3').value = input.shift;
  ws.getCell('E3').value = input.petugas;
  ws.getCell('F3').value = input.shift;
  ws.getCell('H3').value = cabangLabel;
  ws.getCell('J3').value = prevTgl;
  ws.getCell('K3').value = prevShift;
  ws.getCell('L3').value = prevPetugas;
  for (const addr of ['A3','C3','D3','E3','F3','H3','J3','K3','L3']) {
    ws.getCell(addr).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.info.size, color: { argb: 'FF000000' } } as any;
  }
  ws.getCell('A4').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.groupHeader.size, color: { argb: 'FF000000' } } as any;
  ws.getCell('K4').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.groupHeader.size, color: { argb: 'FF000000' } } as any;
  for (let c = 1; c <= 13; c++) {
    ws.getRow(5).getCell(c).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.colHeader.size, color: { argb: 'FF000000' } } as any;
  }

  // ── 5b. Freeze panes: rows 1-5 & columns A-D ─────────────────────
  ws.views = [
    {
      state: 'frozen',
      xSplit: 4, // freeze kolom A-D
      ySplit: 5, // freeze row 1-5
    },
  ];

  // ── 6. Remove template tables + truncate rows 6+ ─────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tablesObj: any = (ws as any).tables || {};
  Object.keys(tablesObj).forEach((name: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ws as any).removeTable(name);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w: any = ws;
  if (ws.rowCount > 5) {
    Object.keys(w._merges || {}).forEach((addr: string) => {
      const row = parseInt((addr.match(/\d+/) || ['0'])[0], 10);
      if (row >= 6) ws.unMergeCells(addr);
    });
    w._rows.splice(5, w._rows.length - 5);
  }

  // ── 7. Write blocks ──────────────────────────────────────────────
  const REGULAR_HEADERS = ['No', 'NAMA BARANG', 'SATUAN', 'THRESHOLD', 'STEP 1\nUTUH', 'STEP 2\nTERBUKA', 'TOTAL', 'STEP 1\nUTUH\n', 'STEP 2\nTERBUKA\n', 'TOTAL 2', 'PEMAKAIAN', 'STATUS\nSTOK', 'KETERANGAN'];
  const GAS_HEADERS = ['No', 'NAMA BARANG', 'SATUAN', 'THRESHOLD', 'NILAI SAAT INI', 'STATUS ISI', 'TGL ISI', 'TGL RESTOCK', 'TGL PAKAI', 'PEMAKAIAN', 'STATUS STOK', 'KETERANGAN', '-'];
  const TOKEN_HEADERS = ['No', 'NAMA BARANG', 'SATUAN', 'THRESHOLD', 'JUMLAH RESTOCK', 'TGL ISI', 'TGL RESTOCK', 'NILAI SAAT INI', 'TGL PAKAI', 'PEMAKAIAN', 'STATUS STOK', 'KETERANGAN', '-'];

  interface BlockInfo {
    block: Block;
    headerRow: number;
    firstDataRow: number;
    lastDataRow: number;
    isArea: boolean;
  }
  const blockInfos: BlockInfo[] = [];
  let currentRow = 6;

  blocks.forEach((block) => {
    const isArea = block.headerType === 'regular' && block.name !== 'Area';

    // Divider (area blocks only)
    if (isArea) {
      const row = ws.getRow(currentRow);
      row.getCell(1).value = '';
      row.getCell(2).value = `▶  ${block.name}`;
      for (let c = 3; c <= 13; c++) row.getCell(c).value = '';
      row.getCell(2).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.divider.size, color: { argb: 'FF000000' } } as any;
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } } as any;
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      ws.mergeCells(`B${currentRow}:M${currentRow}`);
      row.height = 18;
      for (let c = 1; c <= 13; c++) {
        row.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      }
      currentRow++;
    }

    // Subheader row
    const headers = block.headerType === 'regular' ? REGULAR_HEADERS
      : block.headerType === 'utilgas' ? GAS_HEADERS
      : TOKEN_HEADERS;
    const headerRow = currentRow;
    {
      const row = ws.getRow(currentRow);
      for (let c = 1; c <= 13; c++) {
        row.getCell(c).value = headers[c - 1];
        row.getCell(c).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.colHeader.size, color: { argb: 'FF000000' } } as any;
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } } as any;
        row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        row.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      }
      row.height = 28;
      currentRow++;
    }

    // Data rows
    const firstDataRow = currentRow;
    block.items.forEach((dr) => {
      const r = currentRow;
      const row = ws.getRow(r);

      if (dr.type === 'item') {
        const th = typeof dr.threshold === 'number' ? dr.threshold : null;
        const s1 = Number(dr.s1) || 0;
        const s2 = Number(dr.s2) || 0;
        const total = s1 + s2;
        const pTotal = (dr.prevTotal != null && dr.prevTotal !== '') ? Number(dr.prevTotal) : null;
        const pemakaian = (pTotal != null && pTotal !== 0) ? pTotal - total : '';
        const total2 = total;
        const statusStr = regularStatus(s1, s2, th);

        row.getCell(1).value = dr.no;
        row.getCell(2).value = dr.nama || '';
        row.getCell(3).value = dr.satuan || '';
        row.getCell(4).value = dr.threshold ?? '';
        row.getCell(5).value = dr.prevS1 ?? '';
        row.getCell(6).value = dr.prevS2 ?? '';
        row.getCell(7).value = dr.prevTotal ?? '';
        row.getCell(8).value = s1;
        row.getCell(9).value = s2;
        row.getCell(10).value = total2;
        row.getCell(11).value = pemakaian;
        row.getCell(12).value = statusStr;
        row.getCell(13).value = dr.keterangan || '';

        let bgColor = 'FFFFFFFF';
        let textColor = 'FF1E293B';
        if (th != null && th > 0) {
          if (total <= th) { bgColor = 'FFFEE2E2'; textColor = 'FFB91C1C'; }
          else if (total <= th * 2) { bgColor = 'FFFEF9C3'; textColor = 'FFA16207'; }
          else { bgColor = 'FFD1FAE5'; textColor = 'FF047857'; }
        }
        for (let c = 1; c <= 13; c++) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } } as any;
          row.getCell(c).alignment = { horizontal: [1,4,5,6,7,8,9,10,11].includes(c) ? 'center' : 'left', vertical: 'middle', wrapText: true };
          row.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
          row.getCell(c).font = { name: XLSX_FONT.family, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
        }
        row.getCell(10).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
        row.getCell(10).numFmt = '+0;-0;0';
        row.getCell(12).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.data.size, color: { argb: textColor } } as any;
        row.height = 18;

      } else if (dr.type === 'utilgas') {
        const th = typeof dr.threshold === 'number' ? dr.threshold : null;
        const pemakaian = (dr.statusIsi === 'Penuh') ? 'Penuh' : (dr.statusIsi === 'Dipakai') ? 'Dipakai' : 'Habis';
        const statusStr = utilTokenStatus(dr.statusIsi, th);

        row.getCell(1).value = dr.no;
        row.getCell(2).value = dr.nama || '';
        row.getCell(3).value = dr.satuan || '';
        row.getCell(4).value = dr.threshold ?? '';
        row.getCell(5).value = dr.statusIsi || '';
        row.getCell(6).value = dr.statusIsi || '';
        row.getCell(7).value = dr.tglRefill || '';
        row.getCell(8).value = dr.tglRefill || '';
        row.getCell(9).value = dr.tglPakai || '';
        row.getCell(10).value = pemakaian;
        row.getCell(11).value = statusStr;
        row.getCell(12).value = dr.keterangan || '';
        row.getCell(13).value = '';

        let bgColor = 'FFFFFFFF';
        if (th != null && th > 0) {
          const val = Number(dr.statusIsi === 'Penuh' ? 1 : dr.statusIsi === 'Dipakai' ? 0.5 : 0);
          if (val <= th) bgColor = 'FFFEE2E2';
          else if (val <= th * 2) bgColor = 'FFFEF9C3';
          else bgColor = 'FFD1FAE5';
        }
        for (let c = 1; c <= 13; c++) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } } as any;
          row.getCell(c).alignment = { horizontal: [1,4,5,6,7,8,9,10,11].includes(c) ? 'center' : 'left', vertical: 'middle', wrapText: true };
          row.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
          row.getCell(c).font = { name: XLSX_FONT.family, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
        }
        [5,8,10].forEach((c) => {
          row.getCell(c).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
        });
        row.getCell(10).numFmt = '+0;-0;0';
        row.height = 18;

      } else if (dr.type === 'utiltoken') {
        const th = typeof dr.threshold === 'number' ? dr.threshold : null;
        const p1 = Number(dr.prevS1) || 0;
        const p2 = Number(dr.prevS2) || 0;
        const pemakaian = (p1 > 0 || p2 > 0) ? p2 - p1 : '';
        const statusStr = utilTokenStatus(dr.prevS2, th);

        row.getCell(1).value = dr.no;
        row.getCell(2).value = dr.nama || '';
        row.getCell(3).value = dr.satuan || '';
        row.getCell(4).value = dr.threshold ?? '';
        row.getCell(5).value = dr.prevS1 ?? '';
        row.getCell(6).value = dr.tglRefill || '';
        row.getCell(7).value = dr.tglRefill || '';
        row.getCell(8).value = dr.prevS2 ?? '';
        row.getCell(9).value = dr.tglPakai || '';
        row.getCell(10).value = pemakaian;
        row.getCell(11).value = statusStr;
        row.getCell(12).value = dr.keterangan || '';
        row.getCell(13).value = '';

        let bgColor = 'FFFFFFFF';
        if (th != null && th > 0) {
          const val = Number(dr.prevS2) || 0;
          if (val <= th) bgColor = 'FFFEE2E2';
          else if (val <= th * 2) bgColor = 'FFFEF9C3';
          else bgColor = 'FFD1FAE5';
        }
        for (let c = 1; c <= 13; c++) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } } as any;
          row.getCell(c).alignment = { horizontal: [1,4,5,6,7,8,9,10,11].includes(c) ? 'center' : 'left', vertical: 'middle', wrapText: true };
          row.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
          row.getCell(c).font = { name: XLSX_FONT.family, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
        }
        [5,8,10].forEach((c) => {
          row.getCell(c).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
        });
        row.getCell(10).numFmt = '+0;-0;0';
        row.height = 18;
      }

      currentRow++;
    });

    const lastDataRow = currentRow - 1;
    blockInfos.push({ block, headerRow, firstDataRow, lastDataRow, isArea });

    // Add 3 empty rows between area blocks (not utilitas)
    if (isArea) {
      for (let i = 0; i < 3; i++) {
        const emptyRow = ws.getRow(currentRow);
        for (let c = 1; c <= 13; c++) emptyRow.getCell(c).value = '';
        emptyRow.height = 15;
        currentRow++;
      }
    }
  });

  // ── 8. Write note section (outside all tables) ──────────────────
  if (note) {
    const noteHeaderRow = ws.getRow(currentRow);
    noteHeaderRow.getCell(1).value = 'KETERANGAN / CATATAN:';
    ws.mergeCells(`A${currentRow}:M${currentRow}`);
    noteHeaderRow.getCell(1).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.note.size, color: { argb: 'FFFFFFFF' } } as any;
    noteHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } } as any;
    noteHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= 13; c++) {
      noteHeaderRow.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    }
    noteHeaderRow.height = 18;
    currentRow++;

    const noteContentRow = ws.getRow(currentRow);
    noteContentRow.getCell(1).value = note;
    ws.mergeCells(`A${currentRow}:M${currentRow}`);
    noteContentRow.getCell(1).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    noteContentRow.getCell(1).font = { name: XLSX_FONT.family, size: XLSX_FONT.note.size, color: { argb: 'FF000000' } } as any;
    for (let c = 1; c <= 13; c++) {
      noteContentRow.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    }
    noteContentRow.height = 60;
    currentRow++;
  }

  // ── 9. Create Excel Tables per block ──────────────────────────────
  const regularColNames = REGULAR_HEADERS.map(h => h.replace(/\n/g, '_x000a_'));
  const gasColNames = GAS_HEADERS.map(h => h.replace(/\n/g, '_x000a_'));
  const tokenColNames = TOKEN_HEADERS.map(h => h.replace(/\n/g, '_x000a_'));

  blockInfos.forEach((info, idx) => {
    const colNames = info.block.headerType === 'regular' ? regularColNames
      : info.block.headerType === 'utilgas' ? gasColNames
      : tokenColNames;
    const tableName = `SO_Tabel_${idx + 1}`;
    const tableRef = `A${info.headerRow}:M${info.lastDataRow}`;

    try {
      ws.addTable({
        name: tableName,
        ref: tableRef,
        headerRow: true,
        totalsRow: false,
        columns: colNames.map(name => ({ name, filterButton: true })),
        rows: info.block.items.map((dr) => {
          if (dr.type === 'item') {
            const th = typeof dr.threshold === 'number' ? dr.threshold : null;
            const s1 = Number(dr.s1) || 0;
            const s2 = Number(dr.s2) || 0;
            const total = s1 + s2;
            const pTotal = (dr.prevTotal != null && dr.prevTotal !== '') ? Number(dr.prevTotal) : null;
            const pemakaian = (pTotal != null && pTotal !== 0) ? pTotal - total : '';
            return [
              dr.no, dr.nama || '', dr.satuan || '', dr.threshold ?? '',
              dr.prevS1 ?? '', dr.prevS2 ?? '', dr.prevTotal ?? '',
              s1, s2, total, pemakaian, regularStatus(s1, s2, th), dr.keterangan || '',
            ];
          }
          if (dr.type === 'utilgas') {
            const th = typeof dr.threshold === 'number' ? dr.threshold : null;
            return [
              dr.no, dr.nama || '', dr.satuan || '', dr.threshold ?? '',
              dr.statusIsi || '', dr.statusIsi || '', dr.tglRefill || '',
              dr.tglRefill || '', dr.tglPakai || '',
              (dr.statusIsi === 'Penuh') ? 'Penuh' : (dr.statusIsi === 'Dipakai') ? 'Dipakai' : 'Habis',
              utilTokenStatus(dr.statusIsi, th), dr.keterangan || '', '',
            ];
          }
          // utiltoken
          const th = typeof dr.threshold === 'number' ? dr.threshold : null;
          const p1 = Number(dr.prevS1) || 0;
          const p2 = Number(dr.prevS2) || 0;
          return [
            dr.no, dr.nama || '', dr.satuan || '', dr.threshold ?? '',
            dr.prevS1 ?? '', dr.tglRefill || '', dr.tglRefill || '',
            dr.prevS2 ?? '', dr.tglPakai || '',
            (p1 > 0 || p2 > 0) ? p2 - p1 : '',
            utilTokenStatus(dr.prevS2, th), dr.keterangan || '', '',
          ];
        }),
      });
    } catch (err) {
      console.warn(`Failed to create Table '${tableName}':`, err);
    }
  });

  // ── 10. Write buffer ──────────────────────────────────────────────
  const buffer = (await wb.xlsx.writeBuffer()) as unknown as Buffer;
  return { buffer, fileName };
}