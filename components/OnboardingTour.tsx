"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  type TourStep,
  ONBOARDING_TOUR,
  markTourDone,
} from "@/lib/tour";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

const PADDING = 10;
const POPOVER_GAP = 14;

function scrollIntoViewIfNeeded(el: Element) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  if (r.top < 0 || r.bottom > vh) {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  } else if (r.left < 0 || r.right > vw) {
    el.scrollIntoView({ inline: "center", behavior: "smooth" });
  }
}

/**
 * Tur onboarding dengan efek "spotlight": menyorot satu elemen pada satu
 * waktu dan menampilkan popover penjelasan. Komponen hanya dirender ketika
 * sedang aktif (dikelola oleh TourProvider), jadi state selalu segar.
 */
export function OnboardingTour({
  onClose,
  steps = ONBOARDING_TOUR.steps,
}: {
  onClose: () => void;
  steps?: TourStep[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [probe, setProbe] = useState(0);
  // Hitungan gagal menemukan elemen target; dipakai untuk auto-skip step
  // yang elemennya tidak ada (mis. cabang belum dipilih, atau role admin-only).
  const [missCount, setMissCount] = useState(0);

  const step = steps[stepIndex];
  const total = steps.length;
  const isLast = stepIndex === total - 1;

  // Tidak ada langkah yang sesuai untuk role user → tutup tur.
  useEffect(() => {
    if (total === 0) onClose();
  }, [total, onClose]);

  // Apakah langkah ini membutuhkan pindah halaman yang belum aktif?
  const needsNav = Boolean(step.path && step.path !== pathname);

  const measure = useCallback(() => {
    if (step.placement === "center" || !step.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 || r.height > 0) {
      setRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        right: r.right,
      });
    }
  }, [step]);

  // Navigasi ke halaman yang dibutuhkan langkah ini.
  useEffect(() => {
    if (needsNav && step.path) {
      router.push(step.path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsNav, stepIndex]);

  // Ukur elemen target setelah halaman/path sudah sesuai. SetState dipanggil
  // dari dalam timer, sehingga tidak berbeda dengan event callback.
  useEffect(() => {
    if (needsNav) {
      // Jangan ukur selama menunggu navigasi; cek ulang sebentar lagi.
      const t = window.setTimeout(() => setProbe((p) => p + 1), 300);
      return () => window.clearTimeout(t);
    }
    const t0 = window.setTimeout(() => {
      if (step.placement === "center" || !step.selector) {
        setRect(null);
        return;
      }
      const el = document.querySelector(step.selector);
      if (el) scrollIntoViewIfNeeded(el);
      measure();
    }, 0);
    const t1 = window.setTimeout(measure, 250);
    const t2 = window.setTimeout(() => {
      // Elemen target tidak kunjung muncul (mis. belum pilih cabang, atau
      // selector ini di halaman admin-only) → skor miss. Setelah beberapa
      // kali, langkah dilewati otomatis agar tur tidak macet.
      if (step.selector && step.placement !== "center") {
        const el = document.querySelector(step.selector);
        if (!el) {
          setMissCount((c) => c + 1);
          return;
        }
      }
      measure();
    }, 900);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, pathname, probe, needsNav]);

  // Refresh posisi saat scroll/resize.
  useEffect(() => {
    if (step.placement === "center" || !step.selector || needsNav) return;
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [step, needsNav, measure]);

  const goTo = (index: number) => {
    if (index < 0 || index >= total) return;
    setStepIndex(index);
    setRect(null);
  };

  const finish = () => {
    markTourDone();
    onClose();
  };

  // Lewati langkah yang elemennya tidak ditemukan (mis. cabang belum dipilih).
  useEffect(() => {
    if (missCount < 2) return;
    setMissCount(0);
    if (stepIndex < total - 1) {
      goTo(stepIndex + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missCount, stepIndex, total]);

  // Tutup tur dengan tombol Escape (aksesibilitas keyboard).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCenter = step.placement === "center" || (!step.selector && !needsNav);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={step.title}>
      {isCenter ? (
        <div className="absolute inset-0 bg-black/70" />
      ) : (
        rect && (
          <div
            className="absolute rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.72)] ring-2 ring-primary"
            style={{
              left: rect.left - PADDING,
              top: rect.top - PADDING,
              width: rect.width + PADDING * 2,
              height: rect.height + PADDING * 2,
            }}
          />
        )
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className={`fixed z-[101] ${
            isCenter ? "inset-0 flex items-center justify-center" : ""
          }`}
        >
          <div
            className={isCenter ? "" : "relative"}
            style={isCenter ? undefined : positionFor(step, rect)}
          >
            <div className="card bg-base-100 border border-base-300 shadow-2xl max-w-[320px] sm:max-w-sm w-full p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="badge badge-primary badge-sm font-bold">
                  {stepIndex + 1}/{total}
                </span>
                <button
                  onClick={finish}
                  className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
                  aria-label="Tutup tutorial"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-base-content mb-1.5">{step.title}</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">{step.description}</p>

              <div className="flex items-center gap-1 mt-4">
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => goTo(i)}
                    aria-label={`Langkah ${i + 1}`}
                    aria-current={i === stepIndex ? "step" : undefined}
                    className="flex items-center justify-center p-2 -my-2 min-h-[24px] min-w-[24px]"
                  >
                    <span
                      className={`h-1.5 rounded-full transition-all ${
                        i === stepIndex ? "w-5 bg-primary" : "w-1.5 bg-base-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 mt-4">
                {stepIndex > 0 ? (
                  <button onClick={() => goTo(stepIndex - 1)} className="btn btn-ghost btn-sm">
                    <ChevronLeft className="w-4 h-4" />
                    Kembali
                  </button>
                ) : (
                  <span />
                )}
                <button onClick={finish} className="btn btn-ghost btn-sm text-base-content/50">
                  Lewati
                </button>
                {isLast ? (
                  <button onClick={finish} className="btn btn-primary btn-sm">
                    <Check className="w-4 h-4" />
                    Selesai
                  </button>
                ) : (
                  <button onClick={() => goTo(stepIndex + 1)} className="btn btn-primary btn-sm">
                    Berikutnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function positionFor(step: TourStep, rect: Rect | null) {
  if (!rect) return {};
  switch (step.placement) {
    case "left":
      return { right: window.innerWidth - (rect.left - PADDING) + POPOVER_GAP, top: Math.max(8, rect.top) };
    case "right":
      return { left: rect.right + PADDING + POPOVER_GAP, top: Math.max(8, rect.top) };
    case "top":
      return {
        left: Math.max(8, rect.left + rect.width / 2 - 160),
        bottom: window.innerHeight - (rect.top - PADDING) + POPOVER_GAP,
      };
    default:
      return {
        left: Math.max(8, rect.left + rect.width / 2 - 160),
        top: rect.bottom + PADDING + POPOVER_GAP,
      };
  }
}
