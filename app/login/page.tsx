"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { QuantumLoaderMini } from "@/components/ui/QuantumLoader";

const PIN_LENGTH = 6;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) pinRef.current?.focus();
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <QuantumLoaderMini />
        <span className="ml-3 text-primary text-sm font-medium">Memuat...</span>
      </div>
    );
  }

  const canSubmit = username.trim().length > 0 && pin.length === PIN_LENGTH;

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
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
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
                className="input input-bordered w-full min-h-[44px] text-sm"
              />
            </motion.div>

            <motion.div
              key={shake ? 'shake' : 'idle'}
              initial={{ opacity: 0, x: -8 }}
              animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0], opacity: 1 } : { opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <label className="block text-xs font-semibold mb-1.5 text-base-content/70">
                PIN (6 Digit)
              </label>
              <div className="relative">
                <input
                  ref={pinRef}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={PIN_LENGTH}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
                    setPin(val);
                  }}
                  placeholder="Masukkan 6 digit PIN"
                  autoComplete="current-password"
                  className={`input input-bordered w-full min-h-[44px] text-lg font-bold font-mono tabular-nums tracking-[0.3em] text-center pr-12 ${error ? 'border-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-base-content/40 hover:text-base-content/60 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-base-content/40 mt-1 text-center">
                {pin.length}/{PIN_LENGTH} digit
              </p>
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
              disabled={submitting || loading || !canSubmit}
              whileHover={canSubmit ? { scale: 1.01 } : undefined}
              whileTap={canSubmit ? { scale: 0.98 } : undefined}
              className={`btn btn-primary w-full min-h-[44px] text-sm gap-2 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
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
