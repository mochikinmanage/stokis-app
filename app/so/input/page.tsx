'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import { useAuth } from '@/lib/AuthContext';
import {
  ClipboardCheck,
  Send,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  ShieldAlert,
  Hash,
  Search,
  Filter,
  StickyNote,
  X,
  BadgeCheck,
  ArrowUp,
  ArrowDown,
  Pencil,
  AlertTriangle,
} from 'lucide-react';
import { QuantumLoaderFull, QuantumLoaderMini } from '@/components/ui/QuantumLoader';
import { SOGeneratingOverlay, type SOGerStep } from '@/components/SOGeneratingOverlay';
import { staggerContainer, staggerItem } from '@/components/PageTransition';
import { parseTipeInput, hasTipe, sanitizeDecimalInput } from '@/lib/domain/so';
import type { InputTipe } from '@/lib/domain/so';

interface MasterItem {
  Item_ID: string;
  Nama_Barang: string;
  Area: string;
  Satuan: string;
  Threshold: number;
  Tipe_Input: string;
}

interface PreviousSO {
  step1: number;
  step2: number;
  total: number;
  tanggal: string;
  shift: string;
  petugas: string;
  keterangan: string;
  statusIsi?: 'Penuh' | 'Dipakai' | 'Habis' | '';
  tglRefill?: string;
  tglPakai?: string;
}

export interface SOItemPayload {
  itemId: string;
  namaBarang: string;
  satuan: string;
  area: string;
  threshold: number;
  step1: number;
  step2: number;
  total: number;
  keterangan: string;
  prevStep1: number | null;
  prevStep2: number | null;
  prevTotal: number | null;
  prevTanggal: string | null;
  prevShift: string | null;
  prevKeterangan: string;
  statusIsi: 'Penuh' | 'Dipakai' | 'Habis' | '';
  tglRefill: string;
  tglPakai: string;
  prevStatusIsi: 'Penuh' | 'Dipakai' | 'Habis' | '' | null;
  prevTglRefill: string | null;
  prevTglPakai: string | null;
}

export interface SOFormState {
  sesiId: string;
  tanggalOperasional: string;
  shift: string;
  petugas: string;
  items: SOItemPayload[];
  cabangNama: string;
  cabangKode: string;
  note?: string;
}

function generateSesiId(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `SES_${time}${rand}`;
}

export interface SubmitSOResult {
  status?: string;
  sesiId?: string;
  laporanId?: string | null;
  rows_written?: number;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

async function postWithRetry<T = SubmitSOResult>(
  url: string,
  body: unknown,
  attempts: number,
): Promise<{ result: ApiResult<T> }> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ApiResult<T>;
      return { result: json };
    } catch (err) {
      lastErr = err;
      if (attempt < attempts - 1) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// ─── Draft persistence (save sementara agar tinggal lanjutkan setelah refresh) ───
const DRAFT_PREFIX = 'stokis_so_draft_';

interface SODraft {
  counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>;
  sesiId: string;
  tanggalOperasional: string;
  shift: string;
  updatedAt: number;
}

function getDraftKey(cabangId: string): string {
  return DRAFT_PREFIX + cabangId;
}

function countFilled(
  counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>,
): number {
  return Object.keys(counts).reduce((n, k) => {
    const v = counts[k];
    const hasCount =
      String(v?.step1 ?? '').trim() !== '' || String(v?.step2 ?? '').trim() !== '' ||
      v?.statusIsi !== undefined || String(v?.tglRefill ?? '').trim() !== '' || String(v?.tglPakai ?? '').trim() !== '';
    return n + (hasCount ? 1 : 0);
  }, 0);
}

function loadDraft(cabangId: string): SODraft | null {
  try {
    const raw = localStorage.getItem(getDraftKey(cabangId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SODraft;
    if (!parsed || typeof parsed !== 'object' || !parsed.counts) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(cabangId: string, draft: SODraft): void {
  try {
    localStorage.setItem(
      getDraftKey(cabangId),
      JSON.stringify({ ...draft, updatedAt: Date.now() }),
    );
  } catch {
    // Abaikan: mode privat / quota penuh tidak menghalangi input
  }
}

function clearDraft(cabangId: string): void {
  try {
    localStorage.removeItem(getDraftKey(cabangId));
  } catch {
    // abai
  }
}

/**
 * Verify that Link_XLSX has been saved to database and contains valid Drive link.
 * Poll /api/laporan/{laporanId}/wa-link endpoint until Link_XLSX is populated (max 5 retries, 2s interval).
 * 
 * Returns:
 *   - laporanId if verification succeeds and Link_XLSX is a valid Drive link
 *   - throws error if verification fails after all retries
 */
async function verifyXlsxLinkSaved(
  laporanId: string,
  cabangId: string,
  maxRetries: number = 5,
  intervalMs: number = 2000
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use /api/laporan/{laporanId}/wa-link endpoint which is available
      const res = await fetch(`/api/laporan/${laporanId}/wa-link?cabang=${cabangId}`, { credentials: 'include' });
      // Ensure we received JSON; otherwise treat as not ready
      let json: any = null;
      try {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          throw new Error('Non‑JSON or error response');
        }
        json = await res.json();
      } catch (e) {
        console.warn(`[Verify] Attempt ${attempt}/${maxRetries}: failed to parse JSON –`, e);
        json = null;
      }

      if (json && json.success && json.data?.laporan?.Link_XLSX) {
        const link = json.data.laporan.Link_XLSX;
        // Verify it's a Drive link, not fallback API link
        if (link.includes('drive.google.com') || link.includes('drivesdk')) {
          console.log(`✅ Link_XLSX verified: ${link}`);
          return laporanId;
        }
      }

      console.log(`[Verify] Attempt ${attempt}/${maxRetries}: Link_XLSX not yet ready, retrying...`);

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, intervalMs));
      }
    } catch (err) {
      console.error(`[Verify] Attempt ${attempt}/${maxRetries} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, intervalMs));
      }
    }
  }
  
  throw new Error(`Link_XLSX tidak terupdate di database setelah ${maxRetries} percobaan`);
}

export default function InputSOPage() {
  const router = useRouter();
  const { selectedCabang, loading: cabangLoading } = useCabang();
  const { user } = useAuth();

  const [items, setItems] = useState<MasterItem[]>([]);
  const [previousSO, setPreviousSO] = useState<Record<string, PreviousSO>>({});
  const [previousSOInfo, setPreviousSOInfo] = useState<{ tanggal: string; shift: string; petugas?: string; waktu?: string } | null>(null);
  const [previousSOHistory, setPreviousSOHistory] = useState<Array<{
    sesiId: string;
    tanggal: string;
    shift: string;
    petugas: string;
    waktu: string;
    items: Record<string, PreviousSO>;
  }>>([]);
  const [selectedPrevIndex, setSelectedPrevIndex] = useState<number>(0);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form State
  const [tanggalOperasional, setTanggalOperasional] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [shift, setShift] = useState<string>('Opening');

  // Inputs: { [itemId]: { step1: string, step2: string, keterangan: string, statusIsi: string, tglRefill: string, tglPakai: string } }
  const [counts, setCounts] = useState<Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>>({});
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [genStep, setGenStep] = useState<SOGerStep>('simpan');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitResult, setSubmitResult] = useState<string>('');

  const sesiIdRef = useRef<string>('');
  const submittingRef = useRef<boolean>(false);
  const itemsSectionRef = useRef<HTMLDivElement>(null);

  const [lastEditedItemId, setLastEditedItemId] = useState<string | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('Semua');

  // Summary modal state
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [pendingPayload, setPendingPayload] = useState<SOFormState | null>(null);

  // Draft (save sementara) state
  const [pendingDraft, setPendingDraft] = useState<SODraft | null>(null);
  const draftTimer = useRef<number | null>(null);

  // Petugas = logged-in user name
  const petugas = user?.nama || 'Tidak diketahui';

  useEffect(() => {
    if (!selectedCabang) {
      setLoadingData(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingData(true);
        setErrorMsg('');

        const [resItems, resPrevious] = await Promise.all([
          fetch(`/api/master-item?cabang=${selectedCabang.Cabang_ID}`),
          // FIX: kirim cabangId agar GAS bisa resolve spreadsheet yang benar
          fetch(`/api/so/previous?cabang=${selectedCabang.Cabang_ID}`),
        ]);

        const dataItems = await resItems.json();
        const dataPrevious = await resPrevious.json();

        if (dataItems.success && Array.isArray(dataItems.data)) {
          setItems(dataItems.data);
           const initialCounts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }> = {};
          dataItems.data.forEach((item: MasterItem) => {
            initialCounts[item.Item_ID] = { step1: '', step2: '', keterangan: '', statusIsi: undefined, tglRefill: '', tglPakai: '' };
          });
          setCounts(initialCounts);

          const cached = loadDraft(selectedCabang.Cabang_ID);
          if (cached && countFilled(cached.counts) > 0) {
            setPendingDraft(cached);
          }
        }

        if (dataPrevious.success && dataPrevious.data) {
          const history = Array.isArray(dataPrevious.data.history)
            ? dataPrevious.data.history
            : [];
          setPreviousSOHistory(history);

          // Default to the most recent session
          setSelectedPrevIndex(0);
          setPreviousSO(
            history[0]?.items ||
              dataPrevious.data.items ||
              {}
          );
          if (history[0] || dataPrevious.data.latest) {
            const ref = history[0]?.tanggal
              ? history[0]
              : dataPrevious.data.latest;
            setPreviousSOInfo({
              tanggal: ref.tanggal,
              shift: ref.shift,
              petugas: ref.petugas || '',
              waktu: ref.waktu || '',
            });
          }
        }
      } catch (err) {
        setErrorMsg('Gagal memuat data: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [selectedCabang]);

  // Autosave draft (save sementara) ke localStorage, di-debounce
  const cabangId = selectedCabang?.Cabang_ID || null;
  useEffect(() => {
    if (!cabangId) return;
    // Jangan sentuh draft sebelum items dimuat atau sambil menunggu keputusan restore
    if (items.length === 0 || pendingDraft) return;

    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      if (countFilled(counts) > 0) {
        saveDraft(cabangId, {
          counts,
          sesiId: sesiIdRef.current,
          tanggalOperasional,
          shift,
          updatedAt: Date.now(),
        });
      } else {
        clearDraft(cabangId);
      }
    }, 400);
  }, [counts, tanggalOperasional, shift, cabangId, items.length, pendingDraft]);

  // Bersihkan timer saat unmount
  useEffect(() => {
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, []);

  // Choose which previous SO session to use as reference (dropdown)
  const handleSelectPrevious = (index: number) => {
    const session = previousSOHistory[index];
    if (session) {
      setSelectedPrevIndex(index);
      setPreviousSO(session.items || {});
      setPreviousSOInfo({ tanggal: session.tanggal, shift: session.shift, petugas: session.petugas || '', waktu: session.waktu || '' });
    }
  };

  // Extract unique areas from items
  const areas = useMemo(() => {
    const areaSet = new Set(items.map(i => i.Area || 'Area Umum'));
    return Array.from(areaSet).sort();
  }, [items]);

  // Filter items by area and search
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesArea = selectedArea === 'Semua' || (item.Area || 'Area Umum') === selectedArea;
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        item.Nama_Barang.toLowerCase().includes(query) ||
        item.Item_ID.toLowerCase().includes(query);
      return matchesArea && matchesSearch;
    });
  }, [items, selectedArea, searchQuery]);

  const globalIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredItems.forEach((item, idx) => { map[item.Item_ID] = idx + 1; });
    return map;
  }, [filteredItems]);

  if (cabangLoading || loadingData) {
    return <QuantumLoaderFull text="Menyiapkan formulir SO" />;
  }

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 card bg-base-100 border border-base-300 rounded-3xl p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-warning mx-auto" />
        <h3 className="text-base font-bold text-base-content">Pilih Cabang Terlebih Dahulu</h3>
        <p className="text-base-content/60 text-sm">Silakan pilih cabang aktif melalui switcher di bagian atas navigasi.</p>
      </div>
    );
  }

  // Group filtered items by Area
  const groupedItems = filteredItems.reduce((acc, item) => {
    const area = item.Area || 'Area Umum';
    if (!acc[area]) acc[area] = [];
    acc[area].push(item);
    return acc;
  }, {} as Record<string, MasterItem[]>);

  const handleCountChange = (itemId: string, field: 'step1' | 'step2' | 'keterangan' | 'statusIsi' | 'tglRefill' | 'tglPakai', value: string | undefined) => {
    const nextValue =
      field === 'step1' || field === 'step2'
        ? sanitizeDecimalInput(String(value ?? ''))
        : value;
    setCounts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: nextValue,
      },
    }));
    if (field !== 'keterangan') {
      setLastEditedItemId(itemId);
    }
    if (errorMsg) setErrorMsg('');
  };

  const handleRestoreDraft = (draft: SODraft) => {
    if (draft.sesiId) sesiIdRef.current = draft.sesiId;
    if (draft.tanggalOperasional) setTanggalOperasional(draft.tanggalOperasional);
    if (draft.shift) setShift(draft.shift);
    setCounts((prev) => {
      const merged = { ...prev };
      Object.keys(draft.counts).forEach((k) => {
        const dc = draft.counts[k];
        if (
          dc &&
          (String(dc.step1).trim() !== '' ||
            String(dc.step2).trim() !== '' ||
            String(dc.keterangan).trim() !== '' ||
            dc.statusIsi !== undefined ||
            String(dc.tglRefill ?? '').trim() !== '' ||
            String(dc.tglPakai ?? '').trim() !== '')
        ) {
          merged[k] = { ...dc };
        }
      });
      return merged;
    });
    setPendingDraft(null);
  };

  const handleDiscardDraft = () => {
    if (selectedCabang) clearDraft(selectedCabang.Cabang_ID);
    setPendingDraft(null);
  };

  const getStatusBadge = (total: number, thresholdRaw: unknown) => {
    let threshold: number | null = null;
    if (thresholdRaw !== undefined && thresholdRaw !== null && String(thresholdRaw).trim() !== '') {
      const s = String(thresholdRaw).replace(',', '.').trim();
      const n = parseFloat(s);
      if (!isNaN(n)) threshold = n;
    }

    if (threshold === null || threshold < 0) {
      return (
        <span className="badge badge-ghost text-[11px] font-medium gap-1">
          <HelpCircle className="w-3 h-3" />
          <span>Tidak Dipantau</span>
        </span>
      );
    }
    if (total <= threshold) {
      return (
        <span className="badge badge-error text-[11px] font-bold gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>Kritis</span>
        </span>
      );
    }
    if (threshold > 0 && total <= threshold * 2) {
      return (
        <span className="badge badge-warning text-[11px] font-bold gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>Hampir Habis</span>
        </span>
      );
    }
    return (
      <span className="badge badge-success text-[11px] font-bold gap-1">
        <CheckCircle2 className="w-3 h-3" />
        <span>Aman</span>
      </span>
    );
  };

  const buildPayloadItems = (): SOItemPayload[] => {
    return items.map((it) => {
      const c = counts[it.Item_ID] || { step1: '', step2: '', keterangan: '', statusIsi: undefined, tglRefill: '', tglPakai: '' };
      const prev = previousSO[it.Item_ID] || previousSO[it.Nama_Barang] || previousSO[it.Nama_Barang.trim()];
      // Jika step kosong / belum valid (mis. "." saat mengetik), ambil nilai SO sebelumnya.
      const step1Str = String(c.step1).trim();
      const step2Str = String(c.step2).trim();
      const step1Num = Number(step1Str);
      const step2Num = Number(step2Str);
      const step1 = step1Str === '' || !Number.isFinite(step1Num) ? (prev?.step1 ?? 0) : step1Num;
      const step2 = step2Str === '' || !Number.isFinite(step2Num) ? (prev?.step2 ?? 0) : step2Num;
      const total = step1 + step2;
      const prevKeterangan = prev?.keterangan || '';
      const keterangan = c.keterangan.trim() || prevKeterangan;

      // NEW — boolean/date, independen per item
      const tglRefillInput = (c.tglRefill || '').trim();
      const tglRefill = tglRefillInput || prev?.tglRefill || '';

      let statusIsi: 'Penuh' | 'Dipakai' | 'Habis' | '';
      if (c.statusIsi !== undefined && c.statusIsi !== '') {
        statusIsi = c.statusIsi as 'Penuh' | 'Dipakai' | 'Habis';
      } else {
        statusIsi = (prev?.statusIsi as 'Penuh' | 'Dipakai' | 'Habis' | '') ?? '';
      }

      const tglPakaiInput = (c.tglPakai || '').trim();
      const tglPakai = tglPakaiInput || prev?.tglPakai || '';

      return {
        itemId: it.Item_ID,
        namaBarang: it.Nama_Barang,
        satuan: it.Satuan,
        area: it.Area,
        threshold: it.Threshold,
        tipeInput: it.Tipe_Input || '',
        step1,
        step2,
        total,
        keterangan,
        prevStep1: prev?.step1 ?? null,
        prevStep2: prev?.step2 ?? null,
        prevTotal: prev?.total ?? null,
        prevTanggal: prev?.tanggal ?? null,
        prevShift: prev?.shift ?? null,
        prevKeterangan,
        statusIsi,
        tglRefill,
        tglPakai,
        prevStatusIsi: prev?.statusIsi ?? null,
        prevTglRefill: prev?.tglRefill ?? null,
        prevTglPakai: prev?.tglPakai ?? null,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sesiIdRef.current) {
      sesiIdRef.current = generateSesiId();
    }

    const payloadItems = buildPayloadItems();
    const formState: SOFormState = {
      sesiId: sesiIdRef.current,
      tanggalOperasional,
      shift,
      petugas,
      items: payloadItems,
      cabangNama: selectedCabang.Nama_Cabang,
      cabangKode: selectedCabang.Cabang_ID,
      note,
    };
    setPendingPayload(formState);
    setShowSummary(true);
  };

  const handleConfirmedSubmit = async (formState: SOFormState) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setSubmitting(true);
      setShowSummary(false);
      setErrorMsg('');
      setSubmitResult('');
      setGenStep('simpan');

      const body = {
        cabangId: selectedCabang.Cabang_ID,
        sesiId: formState.sesiId,
        tanggalOperasional: formState.tanggalOperasional,
        shift: formState.shift,
        petugas: formState.petugas,
        items: formState.items,
        note: formState.note || '',
      };

      // Retry aman: payload memakai sesiId yang sama → idempotent di backend
      const { result } = await postWithRetry('/api/so', body, 3);

      if (result.error) {
        setErrorMsg(result.error.message || 'Gagal menyimpan data stock opname');
        return;
      }
      if (!result.success) {
        setErrorMsg('Gagal menyimpan data stock opname');
        return;
      }

      const data = result.data;
      const alreadyProcessed = data?.status === 'already_processed';
      const rowsWritten: number =
        typeof data?.rows_written === 'number' ? data.rows_written : formState.items.length;

      let laporanId = data?.laporanId || null;

      setSubmitResult(
        alreadyProcessed
          ? `Sesi ${formState.sesiId} sudah pernah diproses (${rowsWritten} item). Tidak ada data ganda yang dibuat.`
          : `${rowsWritten} item berhasil disimpan.`
      );

      // Buat catatan laporan secara langsung, terlepas dari upload Drive,
      // agar halaman konfirmasi/berbagi selalu punya laporanId yang valid.
      setGenStep('laporan');
      try {
        const laporanRes = await fetch(`/api/so/${laporanId || formState.sesiId}/save-laporan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cabangId: selectedCabang.Cabang_ID,
            sesiId: formState.sesiId,
            tanggalOperasional: formState.tanggalOperasional,
            shift: formState.shift,
            petugas: formState.petugas,
            items: formState.items,
            previousSOInfo,
            note: formState.note || '',
          }),
        });
        const laporanJson = await laporanRes.json().catch(() => null);
        const savedLaporanId = laporanJson?.data?.laporanId;
        if (typeof savedLaporanId === 'string' && savedLaporanId) {
          laporanId = savedLaporanId;
        }
      } catch {
        // catatan laporan bersifat non-critical; laporanId fallback ke sesiId
      }

      // Generate XLSX dan simpan ke Drive - HARUS SELESAI sebelum redirect
      setGenStep('xlsx');
      try {
        const xlsxRes = await fetch(`/api/so/${laporanId || formState.sesiId}/xlsx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: formState.items,
            cabangId: selectedCabang.Cabang_ID,
            cabangNama: formState.cabangNama,
            cabangKode: formState.cabangKode,
            tanggalOperasional: formState.tanggalOperasional,
            shift: formState.shift,
            petugas: formState.petugas,
            previousSOInfo,
            sesiId: formState.sesiId,
            note: formState.note || '',
          }),
        });
        
        // PENTING: Tunggu XLSX benar-benar selesai di-generate dan di-upload
        const xlsxBlob = await xlsxRes.blob();
        console.log('✅ XLSX berhasil di-generate:', xlsxBlob.size, 'bytes');
        
      } catch (xlsxErr) {
        console.error('❌ XLSX generation gagal:', xlsxErr);
        // Tetap lanjut ke halaman konfirmasi meski XLSX gagal (non-critical)
      }

      // Verify Link_XLSX was saved before redirecting
      setGenStep('verifikasi');
      try {
        const verifiedLaporanId = await verifyXlsxLinkSaved(
          laporanId || formState.sesiId,
          selectedCabang.Cabang_ID
        );
        setGenStep('selesai');
        router.push(`/so/konfirmasi/${verifiedLaporanId}`);
      } catch (verifyErr) {
        // Verification failed, but still redirect - UI will show error badge
        console.warn('Link_XLSX verification failed, redirecting anyway:', verifyErr);
        setGenStep('selesai');
        router.push(`/so/konfirmasi/${laporanId || formState.sesiId}`);
      }

      // Submit sukses → hapus draft sementara
      if (selectedCabang) {
        clearDraft(selectedCabang.Cabang_ID);
        setPendingDraft(null);
      }
    } catch (err) {
      setErrorMsg(
        'Terjadi kendala jaringan setelah beberapa percobaan: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const activeFilterCount = (selectedArea !== 'Semua' ? 1 : 0) + (searchQuery ? 1 : 0);

  const scrollTo = (selector: string) => {
    const container = itemsSectionRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToFirstItem = () => {
    scrollTo('[data-item-id]');
  };

  const scrollToLastEditedItem = () => {
    if (!lastEditedItemId) {
      setErrorMsg('Belum ada item yang diisi. Isi minimal satu kolom terlebih dahulu.');
      return;
    }
    scrollTo(`[data-item-id="${lastEditedItemId}"]`);
  };

  const scrollToLastItem = () => {
    const container = itemsSectionRef.current;
    if (!container) return;
    const itemEls = Array.from(container.querySelectorAll<HTMLElement>('[data-item-id]'));
    const last = itemEls[itemEls.length - 1];
    if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Draft restore banner */}
        {pendingDraft && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert alert-warning shadow-lg"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-sm">Ada draft tersimpan yang belum di-submit</h3>
              <p className="text-xs">
                {countFilled(pendingDraft.counts)} item sudah diisi{' '}
                {pendingDraft.updatedAt
                  ? `pada ${new Date(pendingDraft.updatedAt).toLocaleString('id-ID')}. `
                  : ''}
                Lanjutkan dari posisi terakhir?
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleRestoreDraft(pendingDraft)}
                className="btn btn-sm btn-primary"
              >
                Lanjutkan
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="btn btn-sm btn-ghost"
              >
                Buang & Mulai Baru
              </button>
            </div>
          </motion.div>
        )}

        {/* Session Metadata Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="card bg-base-100 border border-base-300 p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 data-onboard="so-input-heading" className="text-lg font-semibold tracking-tight text-base-content">
                  Formulir Input Stock Opname
                </h1>
                <p className="text-sm text-base-content/60">
                  Lokasi Cabang: <span className="font-semibold text-base-content">{selectedCabang.Nama_Cabang}</span>
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-base-200 text-base-content/60 border border-base-300">
              <Hash className="w-3.5 h-3.5" />
              <span>{filteredItems.length} / {items.length} Item</span>
            </div>
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg px-4 py-3 text-sm flex items-center gap-2 bg-error/10 border border-error/30 text-error"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {submitResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg px-4 py-3 text-sm flex items-center gap-2 bg-success/10 border border-success/30 text-success"
                role="alert"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{submitResult}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tanggal Operasional */}
            <div data-onboard="so-tanggal" className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Tanggal Operasional</span>
              </label>
              <input
                type="date"
                value={tanggalOperasional}
                onChange={(e) => setTanggalOperasional(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm font-medium tabular-nums input input-bordered"
              />
            </div>

            {/* Shift */}
            <div data-onboard="so-shift" className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Shift Kerja</span>
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-medium cursor-pointer select select-bordered"
              >
                <option value="Opening">Opening</option>
                <option value="Closing">Closing</option>
              </select>
            </div>

            {/* Petugas — dari login, read-only */}
            <div data-onboard="so-petugas" className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Petugas</span>
              </label>
              <div className="w-full px-3 py-2.5 text-sm font-semibold flex items-center gap-2 min-h-[42px] bg-base-200 border border-base-300 text-base-content">
                <BadgeCheck className="w-4 h-4 flex-shrink-0 text-success" />
                <span>{petugas}</span>
                <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md badge badge-success">
                  Login
                </span>
              </div>
            </div>
          </div>

          {/* Previous SO Reference Selector */}
          <div data-onboard="so-previous" className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>Acuan SO Sebelumnya</span>
              </label>
              <span className="text-[10px] font-medium text-base-content/40">
                (dipakai sebagai pembanding stok)
              </span>
            </div>

            {previousSOHistory.length > 0 ? (
              <select
                value={selectedPrevIndex}
                onChange={(e) => handleSelectPrevious(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm font-medium cursor-pointer select select-bordered"
                aria-label="Pilih sesi SO sebelumnya sebagai acuan"
              >
                {previousSOHistory.map((s, i) => (
                  <option key={s.sesiId} value={i}>
                    {i === 0 ? 'Terbaru' : `Sesi #${previousSOHistory.length - i}`} · {s.tanggal} · {s.shift}
                    {s.petugas ? ` · ${s.petugas}` : ''}
                    {i === 0 ? ' (default)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-base-200 border border-base-300 text-base-content/60">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Belum ada data SO sebelumnya untuk cabang ini.</span>
              </div>
            )}

            {previousSOInfo && previousSOHistory.length > 0 && (
              <p className="text-[11px] text-base-content/50">
                Acuan aktif: <strong>{previousSOInfo.tanggal}</strong> · Shift{' '}
                <strong>{previousSOInfo.shift}</strong>
              </p>
            )}
          </div>
        </motion.div>

        {/* Filter & Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="sticky top-16 z-40 card bg-base-100/95 backdrop-blur-md border border-base-300 shadow-md p-4 space-y-3"
        >
          <div className="flex flex-row gap-2">
            {/* Search */}
            <div data-onboard="so-search" className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
              <input
                type="text"
                placeholder="Cari barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm min-h-[42px] input input-bordered"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-base-content/50 hover:text-base-content transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Area Filter */}
            <div data-onboard="so-area" className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-base-content/50" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="pl-9 pr-8 py-2.5 text-sm font-medium cursor-pointer min-h-[42px] select select-bordered"
              >
                <option value="Semua">Semua Area</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 flex-wrap"
              >
                <span className="text-[11px] font-semibold text-base-content/60">Filter aktif:</span>
                {selectedArea !== 'Semua' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md badge badge-primary">
                    <Layers className="w-3 h-3" />
                    {selectedArea}
                    <button type="button" onClick={() => setSelectedArea('Semua')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md badge badge-primary">
                    <Search className="w-3 h-3" />
                    &quot;{searchQuery}&quot;
                    <button type="button" onClick={() => setSearchQuery('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedArea('Semua'); setSearchQuery(''); }}
                  className="text-[11px] font-medium underline text-base-content/50"
                >
                  Hapus semua
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Items Section by Area */}
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12 card bg-base-100 border border-base-300 p-6 text-base-content/60">
            <p className="text-sm">
              {items.length === 0
                ? 'Belum ada item terdaftar pada master barang cabang ini.'
                : 'Tidak ada item yang cocok dengan filter atau pencarian.'
              }
            </p>
          </div>
        ) : (
          <motion.div
            ref={itemsSectionRef}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {Object.entries(groupedItems).map(([area, areaItems]) => (
              <motion.div key={area} variants={staggerItem} className="card bg-base-100 border border-base-300 overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between bg-base-200 border-b border-base-300">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-base-content">
                      {area}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-base-content/60">
                    {areaItems.length} Item
                  </span>
                </div>

                <div className="border-t border-base-300">
                  {areaItems.map((item) => {
                    const step1Val = counts[item.Item_ID]?.step1 || '';
                    const step2Val = counts[item.Item_ID]?.step2 || '';
                    const keteranganVal = counts[item.Item_ID]?.keterangan || '';
                    const statusIsiVal = counts[item.Item_ID]?.statusIsi;
                    const total = (Number(step1Val) || 0) + (Number(step2Val) || 0);
                    const prev = previousSO[item.Item_ID] || previousSO[item.Nama_Barang] || previousSO[item.Nama_Barang.trim()];

                    const hasPrev = Boolean(prev);
                    const tipeInput: InputTipe[] = parseTipeInput(item.Tipe_Input);
                    const isDual = hasTipe(tipeInput, 'dual');
                    const isBoolean = hasTipe(tipeInput, 'boolean');
                    const isDate = hasTipe(tipeInput, 'date');

                    // Nilai efektif: input user kalau disentuh, else auto-carry dari prev.
                    const effStatus = statusIsiVal !== undefined ? statusIsiVal : (prev?.statusIsi || '');
                    const statusSel = statusIsiVal !== undefined ? statusIsiVal : (prev?.statusIsi || '');
                    const effRefill = (counts[item.Item_ID]?.tglRefill || '') || (prev?.tglRefill || '');
                    const effPakai = (counts[item.Item_ID]?.tglPakai || '') || (prev?.tglPakai || '');

                    return (
                      <div
                        key={item.Item_ID}
                        data-item-id={item.Item_ID}
                        className="px-3 sm:px-4 py-2 transition-colors border-b border-base-300 hover:bg-base-200"
                      >
                        {/* Item header: name, satuan, threshold, status */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {globalIndexMap[item.Item_ID]}
                          </span>
                          <span className="font-extrabold text-[13px] text-base-content">
                            {item.Nama_Barang}
                          </span>
                          <span className="text-[10px] font-mono text-base-content/50">
                            ({item.Satuan})
                          </span>
                          <span className="ml-auto flex items-center gap-3 flex-wrap">
                            {isBoolean ? (
                              effStatus === 'Penuh'
                                ? <span className="badge badge-success text-[11px] font-bold gap-1"><CheckCircle2 className="w-3 h-3" /><span>Penuh</span></span>
                                : effStatus === 'Dipakai'
                                  ? <span className="badge badge-warning text-[11px] font-bold gap-1"><AlertTriangle className="w-3 h-3" /><span>Dipakai</span></span>
                                  : effStatus === 'Habis'
                                    ? <span className="badge badge-error text-[11px] font-bold gap-1"><AlertCircle className="w-3 h-3" /><span>Habis</span></span>
                                    : <span className="badge badge-ghost text-[11px] font-bold gap-1"><HelpCircle className="w-3 h-3" /><span>Pilih...</span></span>
                            ) : (
                              <>
                                <span className="text-[10px] tabular-nums text-base-content/60">
                                  Batas Min: <span className="font-bold text-base-content">{item.Threshold}</span>
                                </span>
                                {getStatusBadge(total, item.Threshold)}
                              </>
                            )}
                          </span>
                        </div>

                        {(isBoolean || isDate) && (
                          <div className={`grid grid-cols-2 gap-1 ${(isBoolean && isDate) ? 'sm:grid-cols-6' : (isBoolean ? 'sm:grid-cols-2' : 'sm:grid-cols-4')}`}>
                            {isBoolean && (
                              <>
                                <div>
                                   <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-base-content/50 text-center">
                                    Status Sebelumnya
                                  </span>
                                  <div className="w-full h-8 px-1 text-center flex items-center justify-center bg-base-200 border border-base-300 text-base-content/60 rounded-md">
                                    <span className="text-[11px] font-bold tabular-nums">{hasPrev && prev.statusIsi ? prev.statusIsi : '–'}</span>
                                  </div>
                                </div>
                                <div>
                                   <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-primary text-center">
                                    Nilai Saat Ini
                                  </span>
                                  <select
                                    value={statusSel}
                                    onChange={(e) => handleCountChange(item.Item_ID, 'statusIsi', e.target.value || '')}
                                    className="w-full h-8 px-1 text-center text-[11px] font-semibold cursor-pointer select select-bordered rounded-md"
                                  >
                                    <option value="">Pilih...</option>
                                    <option value="Penuh">Penuh</option>
                                    <option value="Dipakai">Dipakai</option>
                                    <option value="Habis">Habis</option>
                                  </select>
                                </div>
                              </>
                            )}
                            {isDate && (
                              <>
                                <div>
                                  <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-base-content/50 text-center">
                                    Refill Sebelumnya
                                  </span>
                                  <div className="w-full h-8 px-1 text-center flex items-center justify-center bg-base-200 border border-base-300 text-base-content/60 rounded-md">
                                    <span className="text-[11px] font-bold tabular-nums">{prev?.tglRefill ? prev.tglRefill : '–'}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-primary text-center">
                                    Tgl Refill
                                  </span>
                                  <input
                                    type="date"
                                    value={effRefill}
                                    onChange={(e) => handleCountChange(item.Item_ID, 'tglRefill', e.target.value)}
                                    className="w-full h-8 px-1 text-center text-[11px] font-semibold tabular-nums input input-bordered rounded-md"
                                  />
                                </div>
                                <div>
                                  <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-base-content/50 text-center">
                                    Pakai Sebelumnya
                                  </span>
                                  <div className="w-full h-8 px-1 text-center flex items-center justify-center bg-base-200 border border-base-300 text-base-content/60 rounded-md">
                                    <span className="text-[11px] font-bold tabular-nums">{prev?.tglPakai ? prev.tglPakai : '–'}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-primary text-center">
                                    Tgl Pakai
                                  </span>
                                  <input
                                    type="date"
                                    value={effPakai}
                                    onChange={(e) => handleCountChange(item.Item_ID, 'tglPakai', e.target.value)}
                                    className="w-full h-8 px-1 text-center text-[11px] font-semibold tabular-nums input input-bordered rounded-md"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {!isBoolean && !isDate && (
                          <div className={`grid gap-1 ${isDual ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'}`}>
                            {/* ── SO SEBELUMNYA (read-only) ── */}
                            <div>
                              <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-base-content/50 text-center">
                                S1
                              </span>
                              <div className="w-full h-8 px-1 text-center flex items-center justify-center bg-base-200 border border-base-300 text-base-content/60 rounded-md">
                                <span className="text-[11px] font-bold tabular-nums">{hasPrev ? prev.step1 : '–'}</span>
                              </div>
                            </div>
                            {isDual && (
                              <div>
                                <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-base-content/50 text-center">
                                  S2
                                </span>
                                <div className="w-full h-8 px-1 text-center flex items-center justify-center bg-base-200 border border-base-300 text-base-content/60 rounded-md">
                                  <span className="text-[11px] font-bold tabular-nums">{hasPrev ? prev.step2 : '–'}</span>
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-base-content/50 text-center">
                                Tot
                              </span>
                              <div className="w-full h-8 px-1 text-center flex items-center justify-center bg-base-200 border border-base-300 text-base-content rounded-md">
                                <span className="text-[11px] font-extrabold tabular-nums">{hasPrev ? prev.total : '–'}</span>
                              </div>
                            </div>

                            {/* ── SO SEKARANG (editable) ── */}
                            <div>
                              <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-primary text-center">
                                S1
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={step1Val}
                                onChange={(e) => handleCountChange(item.Item_ID, 'step1', e.target.value)}
                                data-onboard="so-step"
                                className="w-full h-8 px-1 text-center text-[11px] font-bold tabular-nums input input-bordered rounded-md"
                              />
                            </div>
                            {isDual && (
                              <div>
                                <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-primary text-center">
                                  S2
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={step2Val}
                                  onChange={(e) => handleCountChange(item.Item_ID, 'step2', e.target.value)}
                                  className="w-full h-8 px-1 text-center text-[11px] font-bold tabular-nums input input-bordered rounded-md"
                                />
                              </div>
                            )}
                            <div>
                              <span className="block text-[10px] mb-0 font-semibold uppercase tracking-wide text-base-content/60 text-center">
                                Tot
                              </span>
                              <div className="w-full h-8 px-1 text-center flex items-center justify-center bg-primary/10 border border-primary/30 rounded-md">
                                <span className="text-[11px] font-extrabold tabular-nums text-primary">
                                  {total}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Prev session date/shift + Keterangan (Optional Notes) */}
                        <div className="mt-1 flex items-center gap-3 flex-wrap">
                          {hasPrev && (
                            <span className="text-[10px] text-base-content/50">
                              SO Sebelumnya: {prev.tanggal} ({prev.shift})
                            </span>
                          )}
                          <div data-onboard="so-keterangan" className="relative flex-1 min-w-[160px]">
                            <StickyNote
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/50"
                            />
                            <input
                              type="text"
                              placeholder={hasPrev && prev.keterangan ? `Default: ${prev.keterangan}` : 'Keterangan (opsional)...'}
                              value={keteranganVal}
                              onChange={(e) => handleCountChange(item.Item_ID, 'keterangan', e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs input input-bordered"
                            />
                          </div>
                        </div>
                        {hasPrev && (
                          <div className="mt-1.5 px-2.5 py-1 rounded-md bg-base-200 border border-base-300/80 flex items-center gap-2 text-[11px]">
                            <span className="font-semibold text-base-content/60">Keterangan SO Sebelumnya:</span>
                            <span className="font-medium text-base-content/90 italic">
                              {prev.keterangan ? prev.keterangan : '(tidak ada)'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Note laporan (opsional) */}
        <div className="card bg-base-100 border border-base-300 p-3 sm:p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-base-content mb-1.5">
            <StickyNote className="w-4 h-4 text-base-content/50" />
            Catatan Laporan
            <span className="text-[10px] font-normal text-base-content/40">(opsional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tulis catatan untuk laporan ini, mis. kondisi terakhir, hal yang perlu ditindaklanjuti, dsb..."
            rows={3}
            className="w-full textarea textarea-bordered resize-y text-sm"
          />
        </div>

        {/* Floating Action Bar */}
        <div data-onboard="so-submit" className="card bg-base-100 border border-base-300 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-base-content/60">
              Selesaikan sesi pencatatan
            </span>
            <p className="text-sm font-semibold text-base-content">
              Laporan XLSX akan dibuat & link Drive siap dibagikan
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary px-6 py-3 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
          >
            {submitting ? (
              <>
                <QuantumLoaderMini />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Simpan & Buat Laporan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Floating navigation rail */}
      <div data-onboard="so-navrail" className="fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={scrollToFirstItem}
          className="w-9 h-9 flex items-center justify-center bg-primary rounded-full hover:bg-primary/80 transition-colors"
          title="Ke item paling atas"
          aria-label="Ke item paling atas"
        >
          <ArrowUp className="w-4 h-4 text-white" />
        </button>
        <button
          type="button"
          onClick={scrollToLastEditedItem}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${lastEditedItemId ? 'bg-warning hover:bg-warning/80' : 'bg-primary hover:bg-primary/80'}`}
          title="Ke item terakhir yang diisi"
          aria-label="Ke item terakhir yang diisi"
        >
          <Pencil className="w-3.5 h-3.5 text-white" />
        </button>
        <button
          type="button"
          onClick={scrollToLastItem}
          className="w-9 h-9 flex items-center justify-center bg-primary rounded-full hover:bg-primary/80 transition-colors"
          title="Ke item paling bawah"
          aria-label="Ke item paling bawah"
        >
          <ArrowDown className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Summary Modal rendered separately */}
      <AnimatePresence>
        {showSummary && pendingPayload && (
          <SOSummaryModalInline
            formState={pendingPayload}
            onConfirm={() => handleConfirmedSubmit(pendingPayload)}
            onCancel={() => setShowSummary(false)}
          />
        )}
      </AnimatePresence>

      {/* Generating overlay shown saat submit berlangsung */}
      <AnimatePresence>
        {submitting && <SOGeneratingOverlay step={genStep} />}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline Summary Modal (lives here to share SOFormState types)
// ─────────────────────────────────────────────────────────────

function SOSummaryModalInline({
  formState,
  onConfirm,
  onCancel,
}: {
  formState: SOFormState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const kritis = formState.items.filter(i => i.threshold > 0 && (i.step1 + i.step2) <= i.threshold);
  const hampirHabis = formState.items.filter(i => i.threshold > 0 && (i.step1 + i.step2) > i.threshold && (i.step1 + i.step2) <= i.threshold * 2);
  const aman = formState.items.filter(i => i.threshold > 0 && (i.step1 + i.step2) > i.threshold * 2);
  const tidakDipantau = formState.items.filter(i => !i.threshold || i.threshold <= 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-base-100 rounded-xl border border-base-300 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base-content text-base">Ringkasan Stock Opname</h2>
              <p className="text-xs text-base-content/60">Periksa sebelum mengirimkan data</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 text-base-content/40 hover:text-base-content hover:bg-base-200 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session Info */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <span className="text-[11px] text-base-content/60 font-semibold uppercase tracking-wide">Cabang</span>
              <p className="font-semibold text-base-content">{formState.cabangNama}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-base-content/60 font-semibold uppercase tracking-wide">Petugas</span>
              <p className="font-semibold text-base-content">{formState.petugas}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-base-content/60 font-semibold uppercase tracking-wide">Tanggal</span>
              <p className="font-semibold text-base-content tabular-nums">{formState.tanggalOperasional}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-base-content/60 font-semibold uppercase tracking-wide">Shift</span>
              <p className="font-semibold text-base-content">{formState.shift}</p>
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 rounded-lg bg-error/10 border border-error/30">
              <span className="block text-2xl font-extrabold text-error tabular-nums">{kritis.length}</span>
              <span className="text-[10px] font-bold text-error uppercase">Kritis</span>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/30">
              <span className="block text-2xl font-extrabold text-warning tabular-nums">{hampirHabis.length}</span>
              <span className="text-[10px] font-bold text-warning uppercase tracking-wide">H. Habis</span>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/10 border border-success/30">
              <span className="block text-2xl font-extrabold text-success tabular-nums">{aman.length}</span>
              <span className="text-[10px] font-bold text-success uppercase">Aman</span>
            </div>
            <div className="text-center p-3 rounded-lg bg-base-200 border border-base-300">
              <span className="block text-2xl font-extrabold text-base-content/60 tabular-nums">{tidakDipantau.length}</span>
              <span className="text-[10px] font-bold text-base-content/60 uppercase">N/A</span>
            </div>
          </div>

          {/* Critical Items List */}
          {kritis.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-error uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Item Kritis ({kritis.length})
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {kritis.map(item => (
                  <div key={item.itemId} className="flex items-center justify-between px-3 py-1.5 bg-error/10 rounded text-xs border border-error/30">
                    <span className="font-medium text-base-content">{item.namaBarang}</span>
                    <span className="font-bold text-error tabular-nums">
                      {item.step1 + item.step2} / {item.threshold}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items with keterangan */}
          {formState.items.some(i => i.keterangan) && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-base-content/60 uppercase tracking-wide flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Keterangan Diisi
              </span>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {formState.items.filter(i => i.keterangan).map(item => (
                  <div key={item.itemId} className="flex items-start justify-between px-3 py-1.5 bg-base-200 rounded text-xs border border-base-300 gap-2">
                    <span className="font-medium text-base-content flex-shrink-0">{item.namaBarang}:</span>
                    <span className="text-base-content/60 text-right">{item.keterangan}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note laporan */}
          {formState.note?.trim() && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-base-content/60 uppercase tracking-wide flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Catatan Laporan
              </span>
              <div className="px-3 py-2 bg-base-200 rounded text-xs border border-base-300 whitespace-pre-wrap">
                {formState.note}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 btn px-4 py-2.5 text-sm font-medium min-h-[42px]"
          >
            Kembali & Edit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 btn btn-primary px-4 py-2.5 text-sm font-semibold min-h-[42px] flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Konfirmasi & Submit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
