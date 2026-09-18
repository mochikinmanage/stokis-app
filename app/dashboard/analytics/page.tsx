'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, CalendarRange, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { useCabang } from '@/lib/CabangContext';
import { toLocalISO } from '@/lib/domain/so';
import { QuantumLoaderFull } from '@/components/ui/QuantumLoader';

interface UsageItem {
  itemId: string;
  nama: string;
  area: string;
  satuan: string;
  total: number;
  rataRata: number;
  tercatat: number;
  status: string;
}

export default function AnalyticsPage() {
  const { selectedCabang } = useCabang();
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [items, setItems] = useState<UsageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const today = new Date();
    setSampai(toLocalISO(today));
    setDari(toLocalISO(new Date(today.getTime() - 30 * 86400000)));
  }, []);

  useEffect(() => {
    if (!selectedCabang || !dari || !sampai) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/dashboard/mingguan?cabang=${selectedCabang.Cabang_ID}&dari=${dari}&sampai=${sampai}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || 'Gagal memuat analytics');
        setItems(json.data?.analisisPemakaian || []);
        setError('');
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name !== 'AbortError') setError(err instanceof Error ? err.message : 'Gagal memuat analytics');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedCabang, dari, sampai]);

  if (!selectedCabang) return <div className="p-8 text-center">Pilih cabang terlebih dahulu.</div>;
  if (loading) return <QuantumLoaderFull text="Memuat analisis item" />;

  const totalUsage = items.reduce((sum, item) => sum + item.total, 0);
  const biggestDecrease = items.filter((item) => item.total < 0).sort((a, b) => a.total - b.total)[0];
  const biggestIncrease = items.filter((item) => item.total > 0).sort((a, b) => b.total - a.total)[0];

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 pb-20 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" /> Analytics Item</h1>
          <p className="text-sm text-base-content/60 mt-1">Analisis pemakaian dan perubahan stok · {selectedCabang.Nama_Cabang}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/harian" className="btn btn-ghost btn-sm">Dashboard</Link>
          <Link href="/dashboard/mingguan" className="btn btn-ghost btn-sm">Tren</Link>
        </div>
      </header>

      <section className="card bg-base-100 border border-base-300 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-base-content/60 mb-2"><CalendarRange className="w-4 h-4" /> Periode analisis</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="input input-bordered min-h-[44px]" />
          <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="input input-bordered min-h-[44px]" />
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-base-100 border border-base-300 p-4"><Package className="w-5 h-5 text-primary mb-2" /><span className="text-xs text-base-content/60">Item dianalisis</span><strong className="text-2xl">{items.length}</strong></div>
        <div className="card bg-base-100 border border-base-300 p-4"><TrendingDown className="w-5 h-5 text-error mb-2" /><span className="text-xs text-base-content/60">Total perubahan</span><strong className="text-2xl text-error">{totalUsage}</strong></div>
        <div className="card bg-base-100 border border-base-300 p-4"><TrendingDown className="w-5 h-5 text-error mb-2" /><span className="text-xs text-base-content/60">Penurunan terbesar</span><strong className="text-lg text-error break-words">{biggestDecrease?.nama || '-'}</strong></div>
        <div className="card bg-base-100 border border-base-300 p-4"><TrendingUp className="w-5 h-5 text-success mb-2" /><span className="text-xs text-base-content/60">Kenaikan terbesar</span><strong className="text-lg text-success break-words">{biggestIncrease?.nama || '-'}</strong></div>
      </section>

      <section className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="p-5 border-b border-base-300"><h2 className="font-semibold">Pemakaian per Item</h2><p className="text-xs text-base-content/50 mt-1">Nilai negatif menunjukkan stok berkurang dan digunakan.</p></div>
        {items.length === 0 ? <p className="p-5 text-sm text-base-content/50">Belum ada data pemakaian pada periode ini.</p> : (
          <>
            <div className="divide-y divide-base-200 sm:hidden">
              {items.map((item) => (
                <article key={item.itemId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium break-words">{item.nama}</h3>
                      <p className="text-[11px] text-base-content/50 break-all">{item.itemId}</p>
                    </div>
                    <strong className={`shrink-0 text-right ${item.total < 0 ? 'text-error' : 'text-success'}`}>
                      {item.total > 0 ? '+' : ''}{item.total} {item.satuan}
                    </strong>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div><dt className="text-base-content/50">Area</dt><dd className="font-medium break-words">{item.area || '-'}</dd></div>
                    <div><dt className="text-base-content/50">Rata-rata</dt><dd className="font-medium">{item.rataRata.toFixed(1)} {item.satuan}</dd></div>
                    <div><dt className="text-base-content/50">Frekuensi</dt><dd className="font-medium">{item.tercatat}x</dd></div>
                  </dl>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead className="bg-base-200 text-xs text-base-content/60"><tr><th className="p-3 text-left">Item</th><th className="p-3 text-left">Area</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Rata-rata</th><th className="p-3 text-right">Frekuensi</th></tr></thead>
                <tbody>{items.map((item) => <tr key={item.itemId} className="border-t border-base-200"><td className="p-3"><div className="font-medium">{item.nama}</div><div className="text-[11px] text-base-content/50">{item.itemId}</div></td><td className="p-3 text-base-content/60">{item.area}</td><td className={`p-3 text-right font-bold ${item.total < 0 ? 'text-error' : 'text-success'}`}>{item.total > 0 ? '+' : ''}{item.total} {item.satuan}</td><td className="p-3 text-right">{item.rataRata.toFixed(1)} {item.satuan}</td><td className="p-3 text-right text-base-content/60">{item.tercatat}x</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
