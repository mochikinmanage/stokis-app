"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { QuantumLoaderMini } from "@/components/ui/QuantumLoader";

const PIN_LENGTH = 6;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <QuantumLoaderMini />
        <span className="ml-3 text-primary text-sm font-medium">Memuat...</span>
      </div>
    );
  }

  const pin = digits.join("");

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const focusIdx = Math.min(pasted.length, PIN_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || pin.length < PIN_LENGTH) {
      setError("Username dan PIN 6 digit wajib diisi");
      return;
    }
    setSubmitting(true);
    const result = await login(username.trim(), pin);
    setSubmitting(false);
    if (result.success) {
      router.push("/so/input");
    } else {
      setError(result.error || "Login gagal");
      setDigits(Array(PIN_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="card bg-base-100 border border-base-300 shadow-md p-8">
          <div className="flex flex-col items-center mb-8">
            <motion.img
              src="/logo.jpg"
              alt="Stokis"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 h-16 rounded-2xl object-cover shadow-sm mb-4"
            />
            <h1 className="text-xl font-bold text-base-content">
              Masuk ke Stokis
            </h1>
            <p className="text-sm mt-1 text-base-content/50">
              Masukkan username dan PIN Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <label className="block text-xs font-semibold mb-1.5 text-base-content/70">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                autoComplete="username"
                autoFocus
                className="input input-bordered w-full min-h-[42px] text-sm"
              />
            </motion.div>

            <motion.div
              key={error ? 'shake' : 'idle'}
              initial={{ opacity: 0, x: -8 }}
              animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0], opacity: 1 } : { opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <label className="block text-xs font-semibold mb-2 text-base-content/70">
                PIN (6 Digit)
              </label>
              <div
                className="flex items-center justify-center gap-2"
                onPaste={handlePaste}
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    aria-label={`PIN digit ${i + 1}`}
                    className="input input-bordered w-12 h-13 text-center text-lg font-bold font-mono tabular-nums px-0"
                  />
                ))}
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="alert alert-error text-sm py-2"
                  role="alert"
                >
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting || loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary w-full min-h-[42px] text-sm gap-2"
            >
              {submitting ? (
                <>
                  <QuantumLoaderMini />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </motion.button>
          </form>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-center text-xs mt-5 text-base-content/40"
        >
          Stokis v1.0 &middot; Sistem Stock Opname
        </motion.p>
      </motion.div>
    </div>
  );
}
