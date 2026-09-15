'use client';

// components/ReportViewToolbar.tsx
// Toolbar for laporan web view: Download XLSX, Print, Edit (only if logged in).

import { useEffect, useState } from 'react';

interface ReportViewToolbarProps {
  laporanId: string;
  cabangId: string;
}

export function ReportViewToolbar({ laporanId, cabangId }: ReportViewToolbarProps) {
  const [canEdit, setCanEdit] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => setCanEdit(res.ok))
      .catch(() => setCanEdit(false))
      .finally(() => setChecking(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }} className="no-print">
      {/* Download XLSX */}
      <a
        href={`/api/so/${encodeURIComponent(laporanId)}/xlsx-file?cabang=${encodeURIComponent(cabangId)}`}
        download
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', fontSize: 12, fontWeight: 500,
          color: '#2F3437', background: '#FFFFFF',
          border: '1px solid #EAEAEA', borderRadius: 6,
          textDecoration: 'none', cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span className="rv-toolbar-label">XLSX</span>
      </a>

      {/* Print */}
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', fontSize: 12, fontWeight: 500,
          color: '#2F3437', background: '#FFFFFF',
          border: '1px solid #EAEAEA', borderRadius: 6,
          cursor: 'pointer', transition: 'background 150ms ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect width="12" height="8" x="6" y="14" />
        </svg>
        <span className="rv-toolbar-label">Cetak</span>
      </button>

      {/* Edit — only if logged in */}
      {!checking && canEdit && (
        <a
          href={`/laporan/${laporanId}/edit?cabang=${encodeURIComponent(cabangId)}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', fontSize: 12, fontWeight: 600,
            color: '#FFFFFF', background: '#111111',
            border: 'none', borderRadius: 6,
            textDecoration: 'none', cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          <span className="rv-toolbar-label">Edit</span>
        </a>
      )}
    </div>
  );
}
