// app/laporan/[laporanId]/page.tsx
// Viewer read-only laporan — representasi in-app isi laporan (tanpa generate ulang file).
'use client';

import { useState, useEffect, use, useMemo, useRef, useCallback } from 'react';
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
  Filter,
  Search,
} from 'lucide-react';
import { dateTypeStatus, expiryTypeStatus } from '@/lib/domain/report-item-type';

interface LaporanItem {
  Laporan_ID: string;
  Tanggal_Operasional: string;
  Shift: string;
  Petugas: string;
  Item_ID: string;
  Nama_Barang: string;
  Area: string;
  Satuan: string;
  Threshold: number | null;
  Prev_Step1: number | null;
  Prev_Step2: number | null;
  Prev_Total: number | null;
  Prev_Tanggal: string;
  Prev_Shift: string;
  Prev_Keterangan: string;
  Step1: number;
  Step2: number;
  Total: number;
  Penggunaan: number;
  Keterangan: string;
  Status: string;
  Tipe_Input: string;
  Status_Isi: string;
  Tgl_Refill: string;
  Tgl_Pakai: string;
  Note: string;
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
  Prev_Tanggal?: string;
  Prev_Shift?: string;
  Prev_Petugas?: string;
}

// ── Status helpers (konsisten dengan lib/google/template-xlsx.ts) ─────────────

function normalizeDate(date: string | number | null | undefined): Date | null {
  if (!date && date !== 0) return null;
  
  // Handle Excel serial date (number like 46278)
  if (typeof date === 'number' && Number.isFinite(date)) {
    const ms = Math.round((date - 25569) * 86400000);
    if (!Number.isFinite(ms)) return null;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  
  if (!date) return null;
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
function statusBadgeClass(status: string): string {
  const s = String(status || '').toLowerCase();
  if (s.includes('kritis') || s.includes('habis')) return 'badge-error';
  if (s.includes('hampir') || s.includes('dipakai')) return 'badge-warning';
  if (s.includes('aman') || s.includes('penuh')) return 'badge-success';
  return 'badge-ghost';
}

function displayValue(value: string | number | null | undefined): string | number {
  if (value == null || value === '') return '-';
  // Handle Excel serial date numbers in display
  if (typeof value === 'number' && value > 30000 && value < 60000) {
    const d = normalizeDate(value);
    if (d) return formatDateShort(d.toISOString());
  }
  return value;
}

function matchesStatus(status: string, filter: string): boolean {
  if (!filter) return true;
  return String(status || '').toLowerCase().includes(filter.toLowerCase());
}

// Group items by input type architecture
type InputTypeGroup = 'dual' | 'single' | 'boolean' | 'date' | 'expiry' | 'text' | 'utilitas';

function getInputTypeGroup(tipeInput: string): InputTypeGroup {
  const t = (tipeInput || '').toLowerCase();
  if (t.includes('boolean')) return 'boolean';
  if (t.includes('single')) return 'single';
  if (t.includes('date')) return 'date';
  if (t.includes('expiry')) return 'expiry';
  if (t.includes('text')) return 'text';
  if (t.includes('utilitas')) return 'utilitas';
  return 'dual';
}

function getGroupLabel(group: InputTypeGroup): string {
  const labels: Record<InputTypeGroup, string> = {
    dual: 'Dual (Step 1 + Step 2)',
    single: 'Single (Step 1 only)',
    boolean: 'Boolean (Ya/Tidak)',
    date: 'Tanggal (Refill/Pakai)',
    expiry: 'Kedaluwarsa',
    text: 'Teks Keterangan',
    utilitas: 'Utilitas',
  };
  return labels[group];
}

function getGroupColor(group: InputTypeGroup): string {
  const colors: Record<InputTypeGroup, string> = {
    dual: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    single: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    boolean: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    date: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    expiry: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    text: 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800',
    utilitas: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
  };
  return colors[group];
}

function getReportHeaders(type: InputTypeGroup): string[] {
  if (type === 'boolean' || type === 'utilitas') {
    return ['Nilai Saat Ini', 'Tgl Isi', 'Tgl Pakai', 'Status'];
  }
  if (type === 'date') {
    return ['Tgl Tercatat', 'Hari Berlalu', 'Status'];
  }
  if (type === 'expiry') {
    return ['Tgl Kedaluwarsa', 'Sisa Hari', 'Status'];
  }
  if (type === 'text') {
    return ['Keterangan'];
  }
  return ['S1', 'S2', 'Total', 'S1', 'S2', 'Total', 'Pemakaian', 'Status'];
}

export default function LaporanViewerPage({ params }: { params: Promise<{ laporanId: string }> }) {
  const { laporanId } = use(params);
  const router = useRouter();
  const { selectedCabang } = useCabang();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<LaporanItem[]>([]);
  const [meta, setMeta] = useState<LaporanMeta | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState<InputTypeGroup | ''>('');
  const [filterArea, setFilterArea] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState<'' | 'az' | 'za'>('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
      .catch(() => {
        // abaikan: meta opsional
      });

    fetch(`/api/laporan/${laporanId}/detail?cabang=${selectedCabang.Cabang_ID}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setItems(json.data);
        } else {
          setError('Gagal memuat detail laporan');
        }
      })
      .catch(() => {
        setError('Gagal memuat detail laporan');
      })
      .finally(() => setLoading(false));
  }, [selectedCabang?.Cabang_ID, laporanId]);

  const itemStatus = useCallback((it: LaporanItem): string => {
    const single = isSingle(it.Tipe_Input);
    if (isDual(it.Tipe_Input)) return it.Status || regularStatus(it.Step1, single ? 0 : it.Step2, it.Threshold);
    if (isBoolean(it.Tipe_Input)) return booleanStatus(it.Status_Isi).label;
    if (isDate(it.Tipe_Input)) return dateTypeStatus(daysBetweenUtc(normalizeDate(it.Tgl_Refill), baseDate), it.Threshold);
    if (isExpiry(it.Tipe_Input)) return expiryTypeStatus(daysBetweenUtc(baseDate, normalizeDate(it.Tgl_Kedaluwarsa)), it.Threshold);
    return it.Status || '—';
  }, [baseDate]);

  const areaOptions = useMemo(() => {
    return Array.from(new Set(items.map((it) => it.Area || 'Area Umum'))).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    // allow A-Z / Z-A selected via filterStatus as alias
    const effectiveStatus = filterStatus === 'az' || filterStatus === 'za' ? '' : filterStatus;
    const effectiveSort: '' | 'az' | 'za' = sortOrder || (filterStatus === 'az' ? 'az' : filterStatus === 'za' ? 'za' : '');
    const filtered = items.filter((it) => {
      const type = getInputTypeGroup(it.Tipe_Input);
      const area = it.Area || 'Area Umum';
      const haystack = `${it.Nama_Barang || ''} ${it.Item_ID || ''} ${it.Keterangan || ''}`.toLowerCase();
      return (!q || haystack.includes(q))
        && (!filterType || type === filterType)
        && (!filterArea || area === filterArea)
        && matchesStatus(itemStatus(it), effectiveStatus);
    });
    if (effectiveSort === 'az' || effectiveSort === 'za') {
      const dir = effectiveSort === 'az' ? 1 : -1;
      filtered.sort((a, b) => dir * (a.Nama_Barang || '').localeCompare(b.Nama_Barang || '', 'id', { sensitivity: 'base' }));
    }
    return filtered;
  }, [items, filterText, filterType, filterArea, filterStatus, sortOrder, itemStatus]);

  // Group by input type architecture
  const groupedByType = useMemo(() => {
    const groups: Record<InputTypeGroup, LaporanItem[]> = {
      dual: [],
      single: [],
      boolean: [],
      date: [],
      expiry: [],
      text: [],
      utilitas: [],
    };
    
    filteredItems.forEach((it) => {
      const group = getInputTypeGroup(it.Tipe_Input);
      groups[group].push(it);
    });
    
    return groups;
  }, [filteredItems]);

  // Flatten for display - group by type first, then by area
  const groupedItems = useMemo(() => {
    const result: Array<{ type: InputTypeGroup; area: string; items: LaporanItem[] }> = [];
    
    (Object.keys(groupedByType) as InputTypeGroup[]).forEach((type) => {
      const typeItems = groupedByType[type];
      if (typeItems.length === 0) return;
      
      // Group by area within each type
      const byArea = typeItems.reduce((acc, it) => {
        const area = it.Area || 'Area Umum';
        if (!acc[area]) acc[area] = [];
        acc[area].push(it);
        return acc;
      }, {} as Record<string, LaporanItem[]>);
      
      Object.entries(byArea).forEach(([area, areaItems]) => {
        result.push({ type, area, items: areaItems });
      });
    });
    
    return result;
  }, [groupedByType]);

  const badges = useMemo(() => {
    let kritis = 0;
    let hampir = 0;
    items.forEach((it) => {
      const status = itemStatus(it);
      if (status.startsWith('🔴')) kritis += 1;
      else if (status.startsWith('🟠')) hampir += 1;
    });
    return { kritis, hampir };
  }, [items, itemStatus]);

  const note = useMemo(() => {
    return items.find((it) => it.Note)?.Note || '';
  }, [items]);

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
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-10">
      {/* Header - Full Width with SO Info */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 mb-6"
      >
        {/* Top Row: Back button + Title + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-base-200 transition-colors mt-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Laporan Stock Opname
              </h1>
              <p className="text-xs text-base-content/40 font-mono mt-0.5">{laporanId}</p>
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
                XLSX
              </a>
            )}
            {meta?.Link_PDF && (
              <a href={meta.Link_PDF} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-neutral btn-sm gap-1.5">
                <FileDown className="w-4 h-4" />
                PDF
              </a>
            )}
          </div>
        </div>

        {/* SO Info Cards - Tanggal di header, bukan kolom */}
        {meta && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SO Sekarang */}
            <div className="card bg-success/5 border border-success/20">
              <div className="card-body p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-success badge-sm">SO SEKARANG</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-success" />
                    <span className="font-semibold">{formatDateShort(meta.Tanggal_Operasional)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-success" />
                    <span className="font-medium">{meta.Shift || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-success" />
                    <span>{meta.Petugas || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SO Sebelumnya */}
            <div className="card bg-base-200/50 border border-base-300">
              <div className="card-body p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-neutral badge-sm">SO SEBELUMNYA</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium">{formatDateShort(meta.Prev_Tanggal)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{meta.Prev_Shift || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{meta.Prev_Petugas || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Badges */}
        <div className="flex items-center gap-2">
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

      {!error && items.length > 0 && (
        <div className="sticky top-16 z-40 mb-4 card bg-base-100/95 backdrop-blur-md border border-base-300 shadow-md p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-base-content/60 mb-3">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Isi Laporan</span>
            <span className="ml-auto font-normal">{filteredItems.length} dari {items.length} item</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <label className="input input-bordered flex items-center gap-2 min-h-[42px]">
              <Search className="w-4 h-4 text-base-content/40" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Cari item, ID, keterangan..."
                className="grow text-sm"
              />
            </label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as InputTypeGroup | '')} className="select select-bordered min-h-[42px] text-sm">
              <option value="">Semua Tipe</option>
              <option value="dual">Dual</option>
              <option value="single">Single</option>
              <option value="boolean">Boolean</option>
              <option value="date">Tanggal</option>
              <option value="expiry">Kedaluwarsa</option>
              <option value="text">Teks</option>
              <option value="utilitas">Utilitas</option>
            </select>
            <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="select select-bordered min-h-[42px] text-sm">
              <option value="">Semua Area</option>
              {areaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'az' || v === 'za') {
                  setSortOrder(v);
                  setFilterStatus('');
                } else {
                  setFilterStatus(v);
                }
              }}
              className="select select-bordered min-h-[42px] text-sm"
            >
              <option value="">Semua Status</option>
              <option value="kritis">Kritis</option>
              <option value="hampir">Hampir Habis</option>
              <option value="aman">Aman</option>
              <option value="penuh">Penuh</option>
              <option value="dipakai">Dipakai</option>
              <option value="habis">Habis</option>
              <option value="az">A → Z (Nama)</option>
              <option value="za">Z → A (Nama)</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as '' | 'az' | 'za')} className="select select-bordered min-h-[42px] text-sm" title="Urutkan nama barang">
              <option value="">Urutkan: Default</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
            </select>
          </div>
        </div>
      )}

      {/* Items by Input Type Architecture - with Sticky Headers */}
      <div className="space-y-6" ref={tableContainerRef}>
        {groupedItems.map(({ type, area, items: areaItems }, groupIndex) => {
          const reportHeaders = getReportHeaders(type);
          const isRegularBlock = type === 'dual' || type === 'single';
          return (
          <motion.div
            key={`${type}-${area}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.05 }}
            className={`card bg-base-100 border-2 ${getGroupColor(type)} overflow-hidden`}
          >
            {/* Group Type Header */}
            <div className="px-4 py-2 border-b border-base-300 bg-base-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">▶ {area}</span>
                <span className="badge badge-outline badge-sm text-xs">{getGroupLabel(type)}</span>
              </div>
              <div className="text-xs text-base-content/50">
                {areaItems.length} item{areaItems.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Table with sticky first columns */}
            <div className="overflow-x-auto">
              <table className="table table-xs w-full text-xs">
                <thead className="bg-base-200/80 text-base-content/70">
                  <tr>
                    <th rowSpan={isRegularBlock ? 2 : 1} className="sticky left-0 z-30 bg-base-200/80 min-w-[180px]">Item</th>
                    <th rowSpan={isRegularBlock ? 2 : 1} className="sticky left-[180px] z-30 bg-base-200/80 min-w-[80px]">Area</th>
                    <th rowSpan={isRegularBlock ? 2 : 1} className="sticky left-[260px] z-30 bg-base-200/80 min-w-[60px]">Tipe</th>
                    <th rowSpan={isRegularBlock ? 2 : 1} className="sticky left-[320px] z-30 bg-base-200/80 min-w-[50px]">Satuan</th>
                    <th rowSpan={isRegularBlock ? 2 : 1} className="sticky left-[370px] z-30 bg-base-200/80 min-w-[60px]">Threshold</th>
                    {isRegularBlock ? (
                      <>
                        <th colSpan={3} className="text-center bg-base-200/70">SO Sebelumnya</th>
                        <th colSpan={3} className="text-center bg-success/10">SO Sekarang</th>
                        <th rowSpan={2}>Pemakaian</th>
                        <th rowSpan={2}>Status</th>
                        <th rowSpan={2}>Keterangan</th>
                      </>
                    ) : (
                      <>
                        {reportHeaders.map((header) => (
                          <th key={header} className="min-w-[110px]">{header}</th>
                        ))}
                        {type !== 'text' && <th>Keterangan</th>}
                      </>
                    )}
                  </tr>
                  {isRegularBlock && (
                    <tr>
                      <th className="bg-base-200/70 min-w-[50px]">S1</th>
                      <th className="bg-base-200/70 min-w-[50px]">S2</th>
                      <th className="bg-base-200/70 min-w-[60px]">Total</th>
                      <th className="bg-success/10 min-w-[50px]">S1</th>
                      <th className="bg-success/10 min-w-[50px]">S2</th>
                      <th className="bg-success/10 min-w-[60px]">Total</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {areaItems.map((it) => {
                    const single = isSingle(it.Tipe_Input);
                    const bool = isBoolean(it.Tipe_Input);
                    const date = isDate(it.Tipe_Input);
                    const expiry = isExpiry(it.Tipe_Input);
                    
                    const computedStatus = (() => {
                      if (isDual(it.Tipe_Input)) return regularStatus(it.Step1, single ? 0 : it.Step2, it.Threshold);
                      if (bool) return booleanStatus(it.Status_Isi).label;
                      if (date) return dateTypeStatus(daysBetweenUtc(normalizeDate(it.Tgl_Refill), baseDate), it.Threshold);
                      if (expiry) return expiryTypeStatus(daysBetweenUtc(baseDate, normalizeDate(it.Tgl_Kedaluwarsa)), it.Threshold);
                      return it.Status || '—';
                    })();
                    
                    const status = it.Status || computedStatus;
                    
                    return (
                      <tr key={it.Item_ID} className="border-b border-base-200/50 hover:bg-base-100 transition-colors">
                        {/* Sticky columns: Item info */}
                        <td className="sticky left-0 z-10 bg-base-100 border-r border-base-200">
                          <div className="font-semibold text-base-content whitespace-nowrap">{it.Nama_Barang}</div>
                          <div className="font-mono text-xs text-base-content/40">{it.Item_ID}</div>
                        </td>
                        <td className="sticky left-[180px] z-10 bg-base-100 border-r border-base-200 text-base-content/70">{displayValue(it.Area)}</td>
                        <td className="sticky left-[260px] z-10 bg-base-100 border-r border-base-200 text-base-content/60">{displayValue(it.Tipe_Input || 'dual')}</td>
                        <td className="sticky left-[320px] z-10 bg-base-100 border-r border-base-200">{displayValue(it.Satuan)}</td>
                        <td className="sticky left-[370px] z-10 bg-base-100 border-r border-base-200 tabular-nums">{displayValue(it.Threshold)}</td>
                        
                        {isRegularBlock ? (
                          <>
                            <td className="tabular-nums bg-base-200/30 text-center">{displayValue(it.Prev_Step1)}</td>
                            <td className="tabular-nums bg-base-200/30 text-center">{single ? '-' : displayValue(it.Prev_Step2)}</td>
                            <td className="tabular-nums font-semibold bg-base-200/30 text-center">{displayValue(it.Prev_Total)}</td>
                            <td className="tabular-nums bg-success/5 text-center">{displayValue(it.Step1)}</td>
                            <td className="tabular-nums bg-success/5 text-center">{single ? '-' : displayValue(it.Step2)}</td>
                            <td className="tabular-nums font-semibold bg-success/5 text-center">{displayValue(it.Total)}</td>
                            <td className={`tabular-nums font-bold text-center ${it.Penggunaan > 0 ? 'text-success' : it.Penggunaan < 0 ? 'text-error' : 'text-base-content/40'}`}>
                              {it.Penggunaan > 0 ? `+${it.Penggunaan}` : displayValue(it.Penggunaan)}
                            </td>
                            <td><span className={`badge ${statusBadgeClass(status)} whitespace-nowrap text-xs`}>{displayValue(status)}</span></td>
                            <td className="max-w-[200px] truncate" title={it.Keterangan || ''}>
                              {displayValue(it.Keterangan || '-')}
                            </td>
                          </>
                        ) : type === 'boolean' || type === 'utilitas' ? (
                          <>
                            <td className="text-center font-semibold">{displayValue(it.Status_Isi)}</td>
                            <td className="text-center tabular-nums">{formatDateShort(it.Tgl_Refill)}</td>
                            <td className="text-center tabular-nums">{formatDateShort(it.Tgl_Pakai)}</td>
                            <td><span className={`badge ${statusBadgeClass(status)} whitespace-nowrap text-xs`}>{displayValue(status)}</span></td>
                            <td className="max-w-[200px] truncate" title={it.Keterangan || ''}>{displayValue(it.Keterangan || '-')}</td>
                          </>
                        ) : type === 'date' ? (
                          <>
                            <td className="text-center tabular-nums">{formatDateShort(it.Tgl_Refill)}</td>
                            <td className="text-center tabular-nums">{displayValue(daysBetweenUtc(normalizeDate(it.Tgl_Refill), baseDate))}</td>
                            <td><span className={`badge ${statusBadgeClass(status)} whitespace-nowrap text-xs`}>{displayValue(status)}</span></td>
                            <td className="max-w-[200px] truncate" title={it.Keterangan || ''}>{displayValue(it.Keterangan || '-')}</td>
                          </>
                        ) : type === 'expiry' ? (
                          <>
                            <td className="text-center tabular-nums">{formatDateShort(it.Tgl_Kedaluwarsa)}</td>
                            <td className="text-center tabular-nums">{displayValue(daysBetweenUtc(baseDate, normalizeDate(it.Tgl_Kedaluwarsa)))}</td>
                            <td><span className={`badge ${statusBadgeClass(status)} whitespace-nowrap text-xs`}>{displayValue(status)}</span></td>
                            <td className="max-w-[200px] truncate" title={it.Keterangan || ''}>{displayValue(it.Keterangan || '-')}</td>
                          </>
                        ) : (
                          <td className="max-w-[360px] whitespace-pre-wrap" title={it.Keterangan || ''}>{displayValue(it.Keterangan || '-')}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
          );
        })}
      </div>

      {/* Note as bottom box - replacing column */}
      {note && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 card bg-warning/5 border border-warning/30"
        >
          <div className="card-body p-4">
            <div className="flex items-start gap-2">
              <div className="badge badge-warning badge-sm">CATATAN</div>
              <p className="text-sm text-base-content/80 whitespace-pre-wrap">{note}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
