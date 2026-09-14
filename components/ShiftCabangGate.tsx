'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Clock, ArrowLeft, ChevronRight, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Cabang } from '@/lib/CabangContext';

interface ShiftCabangGateProps {
  open: boolean;
  cabangList: Cabang[];
  initialCabangId: string | null;
  initialShift: string;
  getDraftShift: (cabangId: string) => string | null;
  onConfirm: (cabangId: string, shift: string) => void;
}

const SHIFT_OPTIONS = ['Opening', 'Closing'] as const;

export function ShiftCabangGate({
  open,
  cabangList,
  initialCabangId,
  initialShift,
  getDraftShift,
  onConfirm,
}: ShiftCabangGateProps) {
  const [step, setStep] = useState<'cabang' | 'shift'>('cabang');
  const [cabangId, setCabangId] = useState<string | null>(initialCabangId);
  const [shift, setShift] = useState<string>(initialShift);

  const selectedCabang = cabangList.find((c) => c.Cabang_ID === cabangId) || null;
  const draftShift = cabangId ? getDraftShift(cabangId) : null;
  const hasDraftMismatch = !!draftShift && shift !== draftShift;

  const nextDisabled = step === 'cabang' ? !selectedCabang : !shift;

  const handleNext = () => {
    if (step === 'cabang' && selectedCabang) {
      setStep('shift');
    }
  };

  const handleConfirm = () => {
    if (!selectedCabang || !shift) return;
    onConfirm(selectedCabang.Cabang_ID, shift);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gate-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-md card bg-base-100 border border-base-300 shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 id="gate-title" className="text-base font-bold text-base-content">
                  Konfirmasi Input Stock Opname
                </h2>
                <p className="text-xs text-base-content/60">
                  Pastikan cabang dan shift sudah benar sebelum mengisi.
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {(['cabang', 'shift'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      (step === s || (step === 'shift' && s === 'cabang'))
                        ? 'bg-primary'
                        : 'bg-base-200'
                    }`}
                  />
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                    step === s ? 'text-primary' : 'text-base-content/40'
                  }`}>
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1: Cabang */}
            {step === 'cabang' && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-base-content/60">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span>Pilih Cabang</span>
                </div>
                {cabangList.length === 0 ? (
                  <p className="text-sm text-base-content/60">
                    Tidak ada cabang yang tersedia untuk akun Anda.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {cabangList.map((c) => {
                      const isSelected = c.Cabang_ID === cabangId;
                      return (
                        <button
                          key={c.Cabang_ID}
                          type="button"
                          onClick={() => setCabangId(c.Cabang_ID)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 ring-1 ring-primary'
                              : 'border-base-300 bg-base-100 hover:bg-base-200'
                          }`}
                        >
                          <span className="text-sm font-semibold text-base-content">
                            {c.Nama_Cabang}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Shift */}
            {step === 'shift' && selectedCabang && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-base-200/70 border border-base-300">
                  <span className="text-xs font-semibold text-base-content/60">Cabang terpilih</span>
                  <span className="text-sm font-bold text-base-content">{selectedCabang.Nama_Cabang}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-base-content/60">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Pilih Shift Kerja</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SHIFT_OPTIONS.map((s) => {
                    const isSelected = shift === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setShift(s)}
                        className={`px-4 py-3 rounded-xl border text-center transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-base-300 bg-base-100 hover:bg-base-200'
                        }`}
                      >
                        <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-base-content'}`}>
                          {s}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-primary" />}
                      </button>
                    );
                  })}
                </div>

                {hasDraftMismatch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs bg-warning/10 border border-warning/30 text-warning"
                    role="alert"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Ada draft tersimpan untuk shift <strong>{draftShift}</strong> pada cabang ini.
                      Draft tersebut tidak akan dipakai dan diabaikan saat submit.
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {step === 'shift' ? (
                <button type="button" onClick={() => setStep('cabang')} className="btn btn-sm btn-ghost gap-1.5">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
              ) : (
                <span className="text-[11px] text-base-content/50 px-1">
                  Langkah {step === 'cabang' ? '1' : '2'} dari 2
                </span>
              )}

              {step === 'cabang' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={nextDisabled}
                  className="btn btn-sm btn-primary gap-1.5"
                >
                  Lanjut
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={nextDisabled}
                  className="btn btn-sm btn-primary gap-1.5"
                >
                  Mulai Input
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}