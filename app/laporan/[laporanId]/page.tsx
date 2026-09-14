// app/laporan/[laporanId]/page.tsx
// Viewer read-only laporan — representasi in-app isi laporan (tanpa generate ulang file).
'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCabang } from '@/lib/CabangContext';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  Table,
  FileDown,
  Pencil,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { dateTypeStatus, expiryTypeStatus } from '@/lib/domain/report-item-type';

interface LaporanItem {
  Item_ID: string;
  Nama_Barang: string;
  Area: string;
  Satuan: string;
  Threshold: number | null;
  Step1: number;
  Step2: number;
  Keterangan: string;
  Tipe_Input: string;
  Status_Isi: string;
  Tgl_Refill: string;
  Tgl_Pakai: string;
  Tgl_Kedaluwarsa: string;
}

interface LaporanMeta {
  Tanggal_Operasional: string;
  Shift: string;
  Petugas: string;
  Link_XLSX: string;
  Link_PDF: string;
  Jumlah_Kritis: number;
  Jumlah_Hampir_Habis: number;
  Status_Kirim_WA: string;
}

// ── Status helpers (konsisten dengan lib/google/template-xlsx.ts) ─────────────

function normalizeDate(date: string | null | undefined): Date | null {
  if (!date) return null;
  const s = String(date).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
  if (m) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetweenUtc(from: Date | null, to: Date | null): number | null {
  if (!from || !to) return null;
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.floor((b - a) / 86400000);
}

function regularStatus(s1: number, s2: number, threshold: number | null): string {
  const total = s1 + s2;
  if (threshold == null || threshold <= 0) return '—';
  if (total <= threshold) return '🔴 KRITIS';
  if (total <= threshold * 2) return '🟠 HAMPIR HABIS';
  return '🟢 AMAN';
}

function booleanStatus(statusIsi: string): { label: string; tone: 'error' | 'warning' | 'success' | 'ghost' } {
  const s = (statusIsi || '').toLowerCase();
  if (s === 'habis') return { label: '🔴 KRITIS — Habis', tone: 'error' };
  if (s === 'dipakai') return { label: '🟠 HAMPIR HABIS — Dipakai', tone: 'warning' };
  if (s === 'penuh') return { label: '🟢 AMAN — Penuh', tone: 'success' };
  return { label: '—', tone: 'ghost' };
}

function formatDateShort(date: string | null | undefined): string {
  const v = normalizeDate(date);
  if (!v) return '-';
  return `${String(v.getUTCDate()).padStart(2, '0')}/${String(v.getUTCMonth() + 1).padStart(2, '0')}/${v.getUTCFullYear()}`;
}

function isDual(tipeInput: string) {
  const t = (tipeInput || '').toLowerCase();
  return t.includes('dual') || (!t.includes('single') && !t.includes('boolean') && !t.includes('date') && !t.includes('text') && !t.includes('expiry'));
}
const isSingle = (tipeInput: string) => (tipeInput || '').toLowerCase().includes('single');
const isBoolean = (tipeInput: string) => (tipeInput || '').toLowerCase().includes('boolean');
const isDate = (tipeInput: string) => (tipeInput || '').toLowerCase().includes('date');
const isExpiry = (tipeInput: string) => (tipeInput || '').toLowerCase().includes('expiry');
const isText = (tipeInput: string) => (tipeInput || '').toLowerCase().includes('text');

const STATUS_BADGE: Record<string, string> = {
  '—': 'badge-ghost',
  '🔴 KRITIS': 'badge-error',
  '🟠 HAMPIR HABIS': 'badge-warning',
  '🟢 AMAN': 'badge-success',
};

export default function LaporanViewerPage({ params }: { params: Promise<{ laporanId: string }> }) {
  const { laporanId } = use(params);
  const router = useRouter();
  const { selectedCabang } = useCabang();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<LaporanItem[]>([]);
  const [meta, setMeta] = useState<LaporanMeta | null>(null);

  // Tanggal acuan untuk tipe date/expiry = tanggal operasional laporan (sesuai isi XLSX).
  const baseDate = useMemo(
    () => normalizeDate(meta?.Tanggal_Operasional) ?? new Date(),
    [meta?.Tanggal_Operasional]
  );

  useEffect(() => {
    if (!selectedCabang?.Cabang_ID || !laporanId) return;

    fetch(`/api/laporan/${laporanId}?cabang=${selectedCabang.Cabang_ID}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setMeta(json.data);
        }
      })
      .catch(console.error);

    fetch(`/api/laporan/${laporanId}/detail?cabang=${selectedCabang.Cabang_ID}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setItems(json.data);
        } else {
          setError('Gagal memuat detail laporan');
        }
      })
      .catch((e) => {
        console.error(e);
        setError('Gagal memuat detail laporan');
      })
      .finally(() => setLoading(false));
  }, [selectedCabang?.Cabang_ID, laporanId]);

  const groupedItems = useMemo(
    () =>
      items.reduce((acc, it) => {
        const area = it.Area || 'Area Umum';
        if (!acc[area]) acc[area] = [];
        acc[area].push(it);
        return acc;
      }, {} as Record<string, LaporanItem[]>),
    [items]
  );

  const badges = useMemo(() => {
    let kritis = 0;
    let hampir = 0;
    items.forEach((it) => {
      const t = (it.Tipe_Input || '').toLowerCase();
      let status = '—';
      if (isDual(it.Tipe_Input)) {
        status = regularStatus(it.Step1, isSingle(it.Tipe_Input) ? 0 : it.Step2, it.Threshold);
      } else if (isBoolean(it.Tipe_Input)) {
        status = booleanStatus(it.Status_Isi).label;
      } else if (isDate(it.Tipe_Input)) {
        const hariBerlalu = daysBetweenUtc(normalizeDate(it.Tgl_Refill), baseDate);
        status = dateTypeStatus(hariBerlalu, it.Threshold);
      } else if (isExpiry(it.Tipe_Input)) {
        const sisaHari = daysBetweenUtc(baseDate, normalizeDate(it.Tgl_Kedaluwarsa));
        status = expiryTypeStatus(sisaHari, it.Threshold);
      }
      if (status.startsWith('🔴')) kritis += 1;
      else if (status.startsWith('🟠')) hampir += 1;
    });
    return { kritis, hampir };
  }, [items, baseDate]);

  if (!selectedCabang) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="card bg-base-100 border border-base-300 p-8 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 mx-auto text-warning" />
          <h3 className="text-base font-bold">Pilih Cabang Terlebih Dahulu</h3>
          <p className="text-sm text-base-content/60">Silakan pilih cabang aktif melalui menu di navbar atas.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3 mb-6"
      >
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Laporan Stock Opname
            </h1>
            {meta && (
              <div className="mt-1.5 space-y-0.5">
                <p className="text-sm text-base-content/60 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {meta.Tanggal_Operasional || '-'} · <Clock className="w-3.5 h-3.5" /> {meta.Shift || '-'} ·{' '}
                  <User className="w-3.5 h-3.5" /> {meta.Petugas || '-'}
                </p>
                <p className="text-xs text-base-content/40 font-mono">{laporanId}</p>
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              {badges.kritis > 0 && (
                <span className="badge badge-error gap-1">{badges.kritis} Kritis</span>
              )}
              {badges.hampir > 0 && (
                <span className="badge badge-warning gap-1">{badges.hampir} Hampir Habis</span>
              )}
              {badges.kritis === 0 && badges.hampir === 0 && (
                <span className="badge badge-success gap-1">Semua Aman</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <a
            href="/docs/user-guide/laporan"
            className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-primary"
            title="Buka panduan Laporan"
          >
            <HelpCircle className="w-4 h-4" />
          </a>
          <a href={`/laporan/${laporanId}/edit`} className="btn btn-primary btn-sm gap-1.5">
            <Pencil className="w-4 h-4" />
            Edit
          </a>
          {meta?.Link_XLSX && (
            <a href={meta.Link_XLSX} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-info btn-sm gap-1.5">
              <Table className="w-4 h-4" />
              Unduh XLSX
            </a>
          )}
          {meta?.Link_PDF && (
            <a href={meta.Link_PDF} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-neutral btn-sm gap-1.5">
              <FileDown className="w-4 h-4" />
              Unduh PDF
            </a>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="alert alert-error mb-4">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!error && items.length === 0 && (
        <div className="card bg-base-100 border border-base-300 p-12 text-center text-base-content/50">
          Tidak ada item terisi pada laporan ini.
        </div>
      )}

      {/* Items by Area */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([area, areaItems]) => (
          <motion.div
            key={area}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-base-100 border border-base-300"
          >
            <div className="bg-base-200 px-4 py-2 border-b border-base-300 font-semibold text-sm">▶ {area}</div>
            <div className="p-4 space-y-2">
              {areaItems.map((it) => {
                const dual = isDual(it.Tipe_Input);
                const single = isSingle(it.Tipe_Input);
                const bool = isBoolean(it.Tipe_Input);
                const date = isDate(it.Tipe_Input);
                const expiry = isExpiry(it.Tipe_Input);
                const text = isText(it.Tipe_Input);

                let status: { label: string; tone: string } | null = null;
                let detailLine: React.ReactNode = null;

                if (dual) {
                  const total = it.Step1 + (single ? 0 : it.Step2);
                  const label = regularStatus(it.Step1, single ? 0 : it.Step2, it.Threshold);
                  const tone = STATUS_BADGE[label] || 'badge-ghost';
                  status = { label, tone };
                  detailLine = (
                    <div className="text-xs text-base-content/60 whitespace-nowrap tabular-nums">
                      {!single && <span>S1: <b>{it.Step1}</b> · </span>}
                      <span>Total: <b>{total}</b></span>
                      <span className="text-base-content/30"> · Th: {it.Threshold ?? '—'}</span>
                    </div>
                  );
                } else if (bool) {
                  const b = booleanStatus(it.Status_Isi);
                  status = { label: b.label, tone: b.tone === 'ghost' ? 'badge-ghost' : `badge-${b.tone}` };
                  detailLine = (
                    <div className="text-xs text-base-content/60 whitespace-nowrap tabular-nums">
                      Status: <b>{it.Status_Isi || '—'}</b>
                      {it.Tgl_Refill && <span> · Isi ulang: {formatDateShort(it.Tgl_Refill)}</span>}
                    </div>
                  );
                } else if (date) {
                  const hariBerlalu = daysBetweenUtc(normalizeDate(it.Tgl_Refill), baseDate);
                  const label = dateTypeStatus(hariBerlalu, it.Threshold);
                  status = { label, tone: STATUS_BADGE[label] || 'badge-ghost' };
                  detailLine = (
                    <div className="text-xs text-base-content/60 whitespace-nowrap tabular-nums">
                      Terakhir: {formatDateShort(it.Tgl_Refill)}
                      {hariBerlalu != null && <span> · {hariBerlalu} hari lalu</span>}
                      <span className="text-base-content/30"> · Th: {it.Threshold ?? '—'} hari</span>
                    </div>
                  );
                } else if (expiry) {
                  const sisaHari = daysBetweenUtc(baseDate, normalizeDate(it.Tgl_Kedaluwarsa));
                  const label = expiryTypeStatus(sisaHari, it.Threshold);
                  status = { label, tone: STATUS_BADGE[label] || 'badge-ghost' };
                  detailLine = (
                    <div className="text-xs text-base-content/60 whitespace-nowrap tabular-nums">
                      Kedaluwarsa: {formatDateShort(it.Tgl_Kedaluwarsa)}
                      {sisaHari != null && <span> · sisa {sisaHari} hari</span>}
                      <span className="text-base-content/30"> · Th: {it.Threshold ?? '—'} hari</span>
                    </div>
                  );
                } else if (text) {
                  detailLine = (
                    <div className="text-xs text-base-content/60">
                      {it.Keterangan ? <><span className="font-medium">Keterangan:</span> {it.Keterangan}</> : 'Tanpa keterangan'}
                    </div>
                  );
                } else {
                  const label = regularStatus(it.Step1, 0, it.Threshold);
                  status = { label, tone: STATUS_BADGE[label] || 'badge-ghost' };
                  detailLine = (
                    <div className="text-xs text-base-content/60 whitespace-nowrap tabular-nums">
                      Total: <b>{it.Step1}</b> · Th: {it.Threshold ?? '—'}
                    </div>
                  );
                }

                return (
                  <div
                    key={it.Item_ID}
                    className="flex flex-wrap items-center gap-3 p-3 bg-base-50 rounded-lg border border-base-200"
                  >
                    <div className="flex-1 min-w-[150px]">
                      <div className="font-medium text-sm">{it.Nama_Barang}</div>
                      <div className="text-xs text-base-content/50">{it.Satuan}</div>
                    </div>

                    {detailLine}

                    {status && (
                      <span className={`badge ${status.tone} gap-1 whitespace-nowrap`}>{status.label}</span>
                    )}

                    {!text && it.Keterangan && (
                      <span
                        className="w-full text-xs text-base-content/50 truncate"
                        title={it.Keterangan}
                      >
                        Keterangan: {it.Keterangan}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}