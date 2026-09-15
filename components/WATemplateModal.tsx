'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, FileText, User, Calendar, Clock } from 'lucide-react';
import { fadeIn, scaleIn } from './PageTransition';

interface WATemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
  cabangNama: string;
  tanggal: string;
  shift: string;
  petugas: string;
  totalItem: number;
  jumlahKritis: number;
  jumlahHampirHabis: number;
  linkXLSX?: string;
}

export function WATemplateModal({ isOpen, onClose, onSent, ...data }: WATemplateModalProps) {
  const [copied, setCopied] = React.useState(false);

  const activeLink = data.linkXLSX || '';
  const fallbackLink = typeof window !== 'undefined' ? 
    `${window.location.origin}/api/so/[LAPORAN_ID]/xlsx-file?cabang=[CABANG_ID]` : 
    '';

  const totalItemNum = Number(data.totalItem) || 0;
  const kritisNum = Number(data.jumlahKritis) || 0;
  const hampirNum = Number(data.jumlahHampirHabis) || 0;

  const templateText = `
*LAPORAN STOCK OPNAME*
------------------------

Cabang    : ${data.cabangNama}
Tanggal   : ${data.tanggal}
Shift     : ${data.shift.toUpperCase()}
Petugas   : ${data.petugas}

Total Item       : ${totalItemNum}
Status Kritis    : ${kritisNum}
Status Hampir Habis : ${hampirNum}

Laporan XLSX:
${activeLink || fallbackLink.replace('[LAPORAN_ID]', '[ID_LAPORAN]').replace('[CABANG_ID]', '[ID_CABANG]')}
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(templateText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const waBase = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? 'whatsapp://send'
    : 'https://wa.me/';
  const waHref = `${waBase}?text=${encodeURIComponent(templateText)}`;

  if (!isOpen) return null;

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-template-title"
      onClick={onClose}
    >
      <motion.div
        variants={fadeIn}
        className="bg-base-100 rounded-xl border border-base-300 shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-base-300 bg-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success text-success-content">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="wa-template-title" className="font-semibold text-base-content text-base">Siapkan Pesan WhatsApp</h2>
              <p className="text-xs text-base-content/60">Pilih file & salin teks laporan untuk dikirim</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm text-base-content/60 hover:text-error">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-base-content/60 uppercase">
                <Calendar className="w-3.5 h-3.5" /> Tanggal
              </div>
              <div className="px-3 py-2 bg-base-200 rounded-lg text-sm font-semibold text-base-content">{data.tanggal}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-base-content/60 uppercase">
                <Clock className="w-3.5 h-3.5" /> Shift
              </div>
              <div className="px-3 py-2 bg-base-200 rounded-lg text-sm font-semibold text-base-content">{data.shift}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-base-content/60 uppercase">
                <User className="w-3.5 h-3.5" /> Petugas
              </div>
              <div className="px-3 py-2 bg-base-200 rounded-lg text-sm font-semibold text-base-content truncate">{data.petugas}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-base-content/60 uppercase">
                <FileText className="w-3.5 h-3.5" /> Status
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-base-200 rounded-lg">
                <span className="text-xs font-bold text-error">{data.jumlahKritis} Kritis</span>
                <span className="text-xs font-bold text-warning">{data.jumlahHampirHabis} Hampir Habis</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-base-content/60 uppercase">Template Pesan</label>
            <div className="relative">
              <textarea
                value={templateText}
                readOnly
                className="textarea textarea-bordered w-full h-32 text-xs font-mono"
              />
              <button
                onClick={handleCopy}
                className="absolute right-2 top-2 btn btn-ghost btn-xs"
                title="Salin ke Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {copied && (
            <div className="alert alert-success text-xs py-2">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Pesan berhasil disalin!</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0 border-t border-base-300">
          <button
            onClick={onClose}
            className="flex-1 btn min-h-[44px]"
          >
            Tutup
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { onClose(); onSent?.(); }}
            className="flex-1 btn btn-success gap-2 min-h-[44px]"
          >
            <FileText className="w-4 h-4" />
            Kirim ke WhatsApp
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
