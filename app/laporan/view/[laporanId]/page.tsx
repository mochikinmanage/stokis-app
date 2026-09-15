// app/laporan/view/[laporanId]/page.tsx
// Public laporan web view — premium utilitarian minimalism.
// Tidak perlu login (read-only). Toolbar: download XLSX, print, edit (jika login).
// Server component: data di-fetch langsung dari Google Sheets.

import { notFound } from 'next/navigation';
import { buildLaporanView, type ViewItem, type InputTypeGroup } from '@/lib/domain/laporan-view';
import { ReportViewToolbar } from '@/components/ReportViewToolbar';
import './view.css';

export const dynamic = 'force-dynamic';

// ── Icons (inline SVG — no external icon library dependency) ───

function IconFile({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
    </svg>
  );
}

function IconCalendar({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
    </svg>
  );
}

function IconClock({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconUser({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function IconAlert({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  );
}

// ── Type grouping helpers ──────────────────────────────────────

type SubGroup = { type: InputTypeGroup; items: ViewItem[] };

function subGroupItems(items: ViewItem[]): SubGroup[] {
  const typeOrder: InputTypeGroup[] = ['dual', 'single', 'boolean', 'date', 'expiry', 'text'];
  const map = new Map<InputTypeGroup, ViewItem[]>();
  for (const it of items) {
    if (!map.has(it.group)) map.set(it.group, []);
    map.get(it.group)!.push(it);
  }
  return typeOrder.filter((t) => map.has(t)).map((t) => ({ type: t, items: map.get(t)! }));
}

function typeLabel(type: InputTypeGroup): string {
  const labels: Record<InputTypeGroup, string> = {
    dual: 'Dual Input', single: 'Single Input', boolean: 'Boolean',
    date: 'Tanggal', expiry: 'Kedaluwarsa', text: 'Teks', utilitas: 'Utilitas',
  };
  return labels[type];
}

function isRegular(type: InputTypeGroup) {
  return type === 'dual' || type === 'single';
}

// ── Page ───────────────────────────────────────────────────────

export default async function LaporanViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ laporanId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { laporanId } = await params;
  const sp = await searchParams;
  const cabangId = typeof sp.cabang === 'string' ? sp.cabang : '';

  if (!laporanId || !cabangId) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ border: '1px solid #EAEAEA', borderRadius: 8, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}><IconAlert className="w-10 h-10" /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111111', marginBottom: 8 }}>Parameter Tidak Lengkap</h2>
          <p style={{ fontSize: 13, color: '#787774', lineHeight: 1.6 }}>
            URL harus berisi parameter <code style={{ fontFamily: 'monospace', background: '#F7F6F3', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>cabang</code>.
          </p>
        </div>
      </div>
    );
  }

  let view: Awaited<ReturnType<typeof buildLaporanView>>;
  try {
    view = await buildLaporanView(cabangId, laporanId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
    if (msg.includes('tidak ditemukan') || msg.includes('TIDAK_DITEMUKAN') || msg.includes('TIDAK_AKTIF')) notFound();
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ border: '1px solid #FDEBEC', background: '#FDEBEC', borderRadius: 8, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconAlert className="w-5 h-5" />
          <span style={{ fontSize: 13, color: '#9F2F2D' }}>{msg}</span>
        </div>
      </div>
    );
  }

  const { meta, scoreCards, areaGroups } = view;

  return (
    <div className="rv-container">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="rv-header">
        <div className="rv-header-row">
          <div className="rv-header-title">
            <div className="rv-header-icon"><IconFile /></div>
            <div>
              <h1 className="rv-title">LAPORAN STOCK OPNAME</h1>
              <p className="rv-subtitle">
                {meta.cabangNama.toUpperCase()}<span className="rv-sep">&mdash;</span>
                <span className="rv-mono">{meta.laporanId}</span>
              </p>
            </div>
          </div>
          <ReportViewToolbar laporanId={laporanId} cabangId={cabangId} />
        </div>

        {/* ── Score Cards — Bento Grid ─────────────────────── */}
        <div className="rv-score-grid">
          <div className="rv-score rv-score-total">
            <span className="rv-score-value">{scoreCards.total}</span>
            <span className="rv-score-label">Total Item</span>
          </div>
          <div className="rv-score rv-score-kritis">
            <span className="rv-score-value">{scoreCards.kritis}</span>
            <span className="rv-score-label">Kritis</span>
          </div>
          <div className="rv-score rv-score-hampir">
            <span className="rv-score-value">{scoreCards.hampirHabis}</span>
            <span className="rv-score-label">Hampir Habis</span>
          </div>
          <div className="rv-score rv-score-aman">
            <span className="rv-score-value">{scoreCards.aman}</span>
            <span className="rv-score-label">Aman</span>
          </div>
          <div className="rv-score rv-score-tdp">
            <span className="rv-score-value">{scoreCards.tidakDipantau}</span>
            <span className="rv-score-label">Tidak Dipantau</span>
          </div>
        </div>

        {/* ── SO Info Cards ─────────────────────────────────── */}
        <div className="rv-so-grid">
          <div className="rv-so-card rv-so-current">
            <span className="rv-so-badge rv-so-badge-current">SO Sekarang</span>
            <div className="rv-so-info">
              <span className="rv-so-item"><IconCalendar /><strong>{meta.tanggalFormatted}</strong></span>
              <span className="rv-so-item"><IconClock />{meta.shift || '-'}</span>
              <span className="rv-so-item"><IconUser />{meta.petugas || '-'}</span>
            </div>
          </div>
          <div className="rv-so-card rv-so-prev">
            <span className="rv-so-badge rv-so-badge-prev">SO Sebelumnya</span>
            <div className="rv-so-info">
              <span className="rv-so-item"><IconCalendar />{meta.prevTanggalFormatted || '-'}</span>
              <span className="rv-so-item"><IconClock />{meta.prevShift || '-'}</span>
              <span className="rv-so-item"><IconUser />{meta.prevPetugas || '-'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tables by Area ─────────────────────────────────── */}
      <div className="rv-sections">
        {areaGroups.map((group, gi) => {
          const subGroups = subGroupItems(group.items);
          return (
            <section key={group.area} className="rv-area" style={{ animationDelay: `${gi * 60}ms` }}>
              <div className="rv-area-header">
                <h2 className="rv-area-title">{group.area}</h2>
                <span className="rv-area-count">{group.items.length} item</span>
              </div>

              {subGroups.map((sg) => (
                <div key={sg.type} className="rv-subgroup">
                  <div className="rv-subgroup-header">
                    <span className="rv-subgroup-type">{typeLabel(sg.type)}</span>
                    <span className="rv-subgroup-count">{sg.items.length}</span>
                  </div>

                  {/* Desktop table */}
                  <div className="rv-table-wrap">
                    <table className="rv-table">
                      <thead>
                        {isRegular(sg.type) ? (
                          <>
                            <tr>
                              <th rowSpan={2} className="rv-th rv-th-sticky" style={{ width: 36 }}>No</th>
                              <th rowSpan={2} className="rv-th rv-th-sticky" style={{ minWidth: 150 }}>Nama Barang</th>
                              <th rowSpan={2} className="rv-th rv-th-sticky" style={{ width: 56 }}>Satuan</th>
                              <th rowSpan={2} className="rv-th rv-th-sticky" style={{ width: 60 }}>Thresh.</th>
                              <th colSpan={3} className="rv-th rv-th-group">SO Sebelumnya</th>
                              <th colSpan={3} className="rv-th rv-th-group rv-th-current">SO Sekarang</th>
                              <th rowSpan={2} className="rv-th" style={{ width: 72 }}>Pakai</th>
                              <th rowSpan={2} className="rv-th" style={{ minWidth: 100 }}>Status</th>
                              <th rowSpan={2} className="rv-th" style={{ minWidth: 120 }}>Ket.</th>
                            </tr>
                            <tr>
                              <th className="rv-th rv-th-group">S1</th>
                              <th className="rv-th rv-th-group">S2</th>
                              <th className="rv-th rv-th-group">Tot</th>
                              <th className="rv-th rv-th-current">S1</th>
                              <th className="rv-th rv-th-current">S2</th>
                              <th className="rv-th rv-th-current">Tot</th>
                            </tr>
                          </>
                        ) : sg.type === 'boolean' ? (
                          <tr>
                            <th className="rv-th rv-th-sticky" style={{ width: 36 }}>No</th>
                            <th className="rv-th rv-th-sticky" style={{ minWidth: 150 }}>Nama Barang</th>
                            <th className="rv-th rv-th-sticky" style={{ width: 56 }}>Satuan</th>
                            <th className="rv-th rv-th-sticky" style={{ width: 60 }}>Thresh.</th>
                            <th className="rv-th" style={{ minWidth: 80 }}>Nilai</th>
                            <th className="rv-th" style={{ minWidth: 76 }}>Tgl Isi</th>
                            <th className="rv-th" style={{ minWidth: 76 }}>Tgl Pakai</th>
                            <th className="rv-th" style={{ minWidth: 100 }}>Status</th>
                            <th className="rv-th" style={{ minWidth: 120 }}>Ket.</th>
                          </tr>
                        ) : sg.type === 'date' ? (
                          <tr>
                            <th className="rv-th rv-th-sticky" style={{ width: 36 }}>No</th>
                            <th className="rv-th rv-th-sticky" style={{ minWidth: 150 }}>Nama Barang</th>
                            <th className="rv-th rv-th-sticky" style={{ width: 56 }}>Satuan</th>
                            <th className="rv-th rv-th-sticky" style={{ width: 68 }}>Thresh.</th>
                            <th className="rv-th" style={{ minWidth: 76 }}>Tgl Catat</th>
                            <th className="rv-th" style={{ minWidth: 56 }}>Hari</th>
                            <th className="rv-th" style={{ minWidth: 100 }}>Status</th>
                            <th className="rv-th" style={{ minWidth: 120 }}>Ket.</th>
                          </tr>
                        ) : sg.type === 'expiry' ? (
                          <tr>
                            <th className="rv-th rv-th-sticky" style={{ width: 36 }}>No</th>
                            <th className="rv-th rv-th-sticky" style={{ minWidth: 150 }}>Nama Barang</th>
                            <th className="rv-th rv-th-sticky" style={{ width: 56 }}>Satuan</th>
                            <th className="rv-th rv-th-sticky" style={{ width: 68 }}>Thresh.</th>
                            <th className="rv-th" style={{ minWidth: 76 }}>Tgl Exp</th>
                            <th className="rv-th" style={{ minWidth: 52 }}>Sisa</th>
                            <th className="rv-th" style={{ minWidth: 100 }}>Status</th>
                            <th className="rv-th" style={{ minWidth: 120 }}>Ket.</th>
                          </tr>
                        ) : sg.type === 'text' ? (
                          <tr>
                            <th className="rv-th rv-th-sticky" style={{ width: 36 }}>No</th>
                            <th className="rv-th rv-th-sticky" style={{ minWidth: 150 }}>Nama Barang</th>
                            <th className="rv-th rv-th-sticky" style={{ width: 56 }}>Satuan</th>
                            <th className="rv-th">Keterangan</th>
                          </tr>
                        ) : null}
                      </thead>
                      <tbody>
                        {sg.items.map((it, idx) => (
                          <DesktopRow key={it.itemId} item={it} no={idx + 1} type={sg.type} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="rv-mobile-cards">
                    {sg.items.map((it, idx) => (
                      <MobileCard key={it.itemId} item={it} no={idx + 1} type={sg.type} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>

      {/* ── Note ────────────────────────────────────────────── */}
      {meta.note && (
        <div className="rv-note">
          <span className="rv-note-badge">Catatan</span>
          <p className="rv-note-text">{meta.note}</p>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="rv-footer no-print">
        <p>Stokis &mdash; Sistem Stock Opname Multi Cabang</p>
        <p>
          Laporan ini dapat diakses tanpa login. Untuk mengedit, silakan{' '}
          <a href="/login" className="rv-link">masuk</a>.
        </p>
      </footer>
    </div>
  );
}

// ── Desktop table row ──────────────────────────────────────────

function DesktopRow({ item, no, type }: { item: ViewItem; no: number; type: InputTypeGroup }) {
  const isDual = type === 'dual';
  const isSingle = type === 'single';

  return (
    <tr className="rv-tr">
      <td className="rv-td rv-td-sticky rv-td-center">{no}</td>
      <td className="rv-td rv-td-sticky">
        <div className="rv-item-name">{item.namaBarang}</div>
        <div className="rv-item-id">{item.itemId}</div>
      </td>
      <td className="rv-td rv-td-sticky rv-td-muted">{item.satuan || '-'}</td>
      <td className="rv-td rv-td-sticky rv-td-center rv-td-mono">{item.threshold ?? '-'}</td>

      {isDual || isSingle ? (
        <>
          <td className="rv-td rv-td-center rv-td-mono rv-td-prev">{item.prevStep1 ?? '-'}</td>
          <td className="rv-td rv-td-center rv-td-mono rv-td-prev">{isSingle ? '-' : (item.prevStep2 ?? '-')}</td>
          <td className="rv-td rv-td-center rv-td-mono rv-td-prev rv-td-bold">{item.prevTotal ?? '-'}</td>
          <td className="rv-td rv-td-center rv-td-mono rv-td-curr">{item.step1}</td>
          <td className="rv-td rv-td-center rv-td-mono rv-td-curr">{isSingle ? '-' : item.step2}</td>
          <td className="rv-td rv-td-center rv-td-mono rv-td-curr rv-td-bold">{item.total}</td>
          <td className={`rv-td rv-td-center rv-td-mono rv-td-bold ${item.penggunaan > 0 ? 'rv-positive' : item.penggunaan < 0 ? 'rv-negative' : 'rv-zero'}`}>
            {item.penggunaan > 0 ? `+${item.penggunaan}` : item.penggunaan || '-'}
          </td>
          <td className="rv-td"><span className={`rv-badge ${item.badgeClass}`}>{item.statusLabel}</span></td>
          <td className="rv-td rv-td-ket" title={item.keterangan}>{item.keterangan || '-'}</td>
        </>
      ) : type === 'boolean' ? (
        <>
          <td className="rv-td rv-td-center rv-td-bold">{item.statusIsi || '-'}</td>
          <td className="rv-td rv-td-center rv-td-mono">{item.tglRefillFormatted}</td>
          <td className="rv-td rv-td-center rv-td-mono">{item.tglPakaiFormatted}</td>
          <td className="rv-td"><span className={`rv-badge ${item.badgeClass}`}>{item.statusLabel}</span></td>
          <td className="rv-td rv-td-ket" title={item.keterangan}>{item.keterangan || '-'}</td>
        </>
      ) : type === 'date' ? (
        <>
          <td className="rv-td rv-td-center rv-td-mono">{item.tglRefillFormatted}</td>
          <td className="rv-td rv-td-center rv-td-mono rv-td-bold">{item.hariBerlalu ?? '-'}</td>
          <td className="rv-td"><span className={`rv-badge ${item.badgeClass}`}>{item.statusLabel}</span></td>
          <td className="rv-td rv-td-ket" title={item.keterangan}>{item.keterangan || '-'}</td>
        </>
      ) : type === 'expiry' ? (
        <>
          <td className="rv-td rv-td-center rv-td-mono">{item.tglKedaluwarsaFormatted}</td>
          <td className="rv-td rv-td-center rv-td-mono rv-td-bold">{item.sisaHari ?? '-'}</td>
          <td className="rv-td"><span className={`rv-badge ${item.badgeClass}`}>{item.statusLabel}</span></td>
          <td className="rv-td rv-td-ket" title={item.keterangan}>{item.keterangan || '-'}</td>
        </>
      ) : type === 'text' ? (
        <td className="rv-td rv-td-ket" title={item.keterangan}>{item.keterangan || '-'}</td>
      ) : null}
    </tr>
  );
}

// ── Mobile card ────────────────────────────────────────────────

function MobileCard({ item, no, type }: { item: ViewItem; no: number; type: InputTypeGroup }) {
  const isDual = type === 'dual';
  const isSingle = type === 'single';

  return (
    <div className="rv-card">
      <div className="rv-card-head">
        <span className="rv-card-no">{no}</span>
        <div className="rv-card-info">
          <span className="rv-card-name">{item.namaBarang}</span>
          <span className="rv-card-meta">{item.satuan || '-'} &middot; {item.area}</span>
        </div>
        <span className={`rv-badge ${item.badgeClass}`}>{item.statusLabel}</span>
      </div>

      {isDual || isSingle ? (
        <div className="rv-card-grid">
          <div className="rv-card-cell rv-card-cell-label">Threshold</div>
          <div className="rv-card-cell rv-td-mono">{item.threshold ?? '-'}</div>
          <div className="rv-card-cell rv-card-cell-label">SO Sebelumnya</div>
          <div className="rv-card-cell rv-td-mono">
            {item.prevTotal ?? '-'}
            {!isSingle && item.prevStep1 != null && <span className="rv-card-detail">({item.prevStep1}+{item.prevStep2 ?? 0})</span>}
          </div>
          <div className="rv-card-cell rv-card-cell-label">SO Sekarang</div>
          <div className="rv-card-cell rv-td-mono rv-td-bold">
            {item.total}
            {!isSingle && <span className="rv-card-detail">({item.step1}+{item.step2})</span>}
          </div>
          <div className="rv-card-cell rv-card-cell-label">Pemakaian</div>
          <div className={`rv-card-cell rv-td-mono rv-td-bold ${item.penggunaan > 0 ? 'rv-positive' : item.penggunaan < 0 ? 'rv-negative' : 'rv-zero'}`}>
            {item.penggunaan > 0 ? `+${item.penggunaan}` : item.penggunaan || '-'}
          </div>
        </div>
      ) : type === 'boolean' ? (
        <div className="rv-card-grid">
          <div className="rv-card-cell rv-card-cell-label">Nilai</div>
          <div className="rv-card-cell rv-td-bold">{item.statusIsi || '-'}</div>
          <div className="rv-card-cell rv-card-cell-label">Tgl Isi</div>
          <div className="rv-card-cell rv-td-mono">{item.tglRefillFormatted}</div>
          <div className="rv-card-cell rv-card-cell-label">Tgl Pakai</div>
          <div className="rv-card-cell rv-td-mono">{item.tglPakaiFormatted}</div>
        </div>
      ) : type === 'date' ? (
        <div className="rv-card-grid">
          <div className="rv-card-cell rv-card-cell-label">Tgl Tercatat</div>
          <div className="rv-card-cell rv-td-mono">{item.tglRefillFormatted}</div>
          <div className="rv-card-cell rv-card-cell-label">Hari Berlalu</div>
          <div className="rv-card-cell rv-td-mono rv-td-bold">{item.hariBerlalu ?? '-'}</div>
        </div>
      ) : type === 'expiry' ? (
        <div className="rv-card-grid">
          <div className="rv-card-cell rv-card-cell-label">Tgl Kedaluwarsa</div>
          <div className="rv-card-cell rv-td-mono">{item.tglKedaluwarsaFormatted}</div>
          <div className="rv-card-cell rv-card-cell-label">Sisa Hari</div>
          <div className="rv-card-cell rv-td-mono rv-td-bold">{item.sisaHari ?? '-'}</div>
        </div>
      ) : type === 'text' ? (
        <div className="rv-card-ket">{item.keterangan || '-'}</div>
      ) : null}

      {item.keterangan && type !== 'text' && (
        <div className="rv-card-ket">{item.keterangan}</div>
      )}
    </div>
  );
}
