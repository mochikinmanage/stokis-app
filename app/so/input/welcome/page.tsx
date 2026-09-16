'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import { useAuth } from '@/lib/AuthContext';
import {
  ClipboardCheck,
  AlertTriangle,
  RotateCcw,
  Plus,
  HardDrive,
  ArrowLeft,
} from 'lucide-react';

const DRAFT_PREFIX = 'stokis_so_draft_';

interface SODraft {
  counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>;
  sesiId: string;
  tanggalOperasional: string;
  shift: string;
  note: string;
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

function clearDraft(cabangId: string): void {
  try {
    localStorage.removeItem(getDraftKey(cabangId));
  } catch {
    // abai
  }
}

export default function WelcomeSOPage() {
  const router = useRouter();
  const { selectedCabang, cabangList, loading: cabangLoading } = useCabang();
  const { user } = useAuth();
  const [pendingDraft, setPendingDraft] = useState<SODraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (cabangLoading || !user) return;

    const draftCabangId = selectedCabang?.Cabang_ID || user.cabangId;
    if (draftCabangId) {
      const cached = loadDraft(draftCabangId);
      if (cached && countFilled(cached.counts) > 0) {
        setPendingDraft(cached);
      }
    }
    setIsLoading(false);
  }, [cabangLoading, user, selectedCabang]);

  const handleLanjutkan = () => {
    // Draft is already in localStorage, just navigate to input page
    router.push('/so/input');
  };

  const handleMulaiBaru = () => {
    // Clear draft and navigate to input page
    if (selectedCabang?.Cabang_ID) {
      clearDraft(selectedCabang.Cabang_ID);
    }
    router.push('/so/input');
  };

  const handleBatal = () => {
    router.back();
  };

  if (isLoading || cabangLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-base-content/60">Memuat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-base-100 rounded-xl border border-base-300 shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base-300">
          <div className="flex items-center gap-3">
            {pendingDraft ? (
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-base-content text-lg">
                {pendingDraft ? 'Sesi Belum Selesai' : 'Stock Opname'}
              </h1>
              <p className="text-xs text-base-content/60">
                {pendingDraft ? 'Ditemukan data yang belum di-submit' : 'Mulai sesi stock opname baru'}
              </p>
            </div>
          </div>
        </div>

        {/* Session Info - only show if draft exists */}
        {pendingDraft && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-0.5">
                <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Tanggal</span>
                <p className="font-semibold text-base-content">{pendingDraft.tanggalOperasional || 'Tidak tersedia'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Shift</span>
                <p className="font-semibold text-base-content">{pendingDraft.shift || 'Tidak tersedia'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Progress</span>
                <p className="font-semibold text-base-content">{countFilled(pendingDraft.counts)} item terisi</p>
              </div>
              {pendingDraft.updatedAt && (
                <div className="space-y-0.5">
                  <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Terakhir Diedit</span>
                  <p className="font-semibold text-base-content text-xs">
                    {new Date(pendingDraft.updatedAt).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Note preview */}
            {pendingDraft.note && (
              <div className="bg-base-200/50 rounded-lg p-3">
                <p className="text-xs text-base-content/50 mb-1">Catatan:</p>
                <p className="text-sm text-base-content/80 line-clamp-2">{pendingDraft.note}</p>
              </div>
            )}

            {/* Storage info */}
            <div className="flex items-center gap-2 text-xs text-base-content/40">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Data tersimpan di penyimpanan sementara browser</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 p-5 pt-0">
          {pendingDraft && (
            <button
              type="button"
              onClick={handleLanjutkan}
              className="btn btn-primary min-h-[48px] text-base"
            >
              <RotateCcw className="w-4 h-4" />
              Lanjutkan Sesi Sebelumnya
            </button>
          )}
          <button
            type="button"
            onClick={handleMulaiBaru}
            className="btn btn-ghost min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Mulai Sesi Baru
          </button>
          <button
            type="button"
            onClick={handleBatal}
            className="btn btn-ghost min-h-[44px] text-base-content/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Batal
          </button>
        </div>
      </motion.div>
    </div>
  );
}
