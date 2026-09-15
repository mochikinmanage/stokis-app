'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import {
  Package,
  PlusCircle,
  Edit3,
  Check,
  X,
  Loader2,
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  Settings,
  ChevronDown,
  CircleDot,
  Tags,
  Plus,
  Power,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { parseThreshold, sanitizeDecimalInput } from '@/lib/domain/so';
import type { KategoriItem } from '@/lib/domain/kategori-service';

interface MasterItem {
  Item_ID: string;
  Nama_Barang: string;
  Area: string;
  Satuan: string;
  Konversi_Isi?: string;
  Konversi_Keterangan?: string;
  Threshold: number;
  Aktif: boolean;
  Tipe_Input?: string;
  Keterangan?: string;
}

const DEFAULT_AREAS = [
  'Meja Biru Depan',
  'Chiller',
  'Freezer Ayam dan Alat',
  'Barang Alat dan Kebersihan',
  'Meja Laci',
  'Gas dan Utilitas',
  'Area Umum',
];

const TIPE_OPTIONS = [
  { value: 'dual', label: 'Dual (S1+S2)' },
  { value: 'single', label: 'Single (S1)' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'text', label: 'Text' },
  { value: 'expiry', label: 'Expiry' },
  { value: 'boolean,date', label: 'Boolean+Date' },
];

function tipeBadgeColor(t?: string) {
  if (!t) return 'bg-base-200 text-base-content/60';
  if (t.includes('boolean') && t.includes('date')) return 'bg-warning/15 text-warning-content border border-warning/20';
  if (t.includes('boolean')) return 'bg-info/15 text-info-content border border-info/20';
  if (t.includes('date')) return 'bg-secondary/15 text-secondary-content border border-secondary/20';
  if (t.includes('expiry')) return 'bg-error/15 text-error border border-error/20';
  if (t.includes('text')) return 'bg-accent/15 text-accent-content border border-accent/20';
  return 'bg-base-200 text-base-content/60 border border-base-300';
}

export default function MasterItemPage() {
  const { selectedCabang } = useCabang();
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [kategoriLoading, setKategoriLoading] = useState<boolean>(false);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [newItem, setNewItem] = useState({
    Nama_Barang: '',
    Area: DEFAULT_AREAS[0],
    Satuan: 'pcs',
    Konversi_Isi: '',
    Konversi_Keterangan: '',
    Threshold: '0',
    Tipe_Input: 'dual',
    Keterangan: '',
  });
  const [savingItem, setSavingItem] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<string>('0');

  const [editingTipeInput, setEditingTipeInput] = useState<string | null>(null);
  const [tempTipeInput, setTempTipeInput] = useState<string>('dual');

  const [editingKeterangan, setEditingKeterangan] = useState<string | null>(null);
  const [tempKeterangan, setTempKeterangan] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('Semua');

  const fetchItems = async () => {
    if (!selectedCabang) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/master-item?cabang=${selectedCabang.Cabang_ID}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch {
      setErrorMsg('Gagal memuat data barang. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const fetchKategori = async () => {
    if (!selectedCabang) return;
    try {
      setKategoriLoading(true);
      const res = await fetch(`/api/master-item/kategori?cabang=${selectedCabang.Cabang_ID}&includeNonaktif=true`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setKategoriList(json.data);
      }
    } catch {
    } finally {
      setKategoriLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchKategori();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCabang]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCabang) return;

    try {
      setSavingItem(true);
      const res = await fetch('/api/master-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          ...newItem,
          Threshold: parseThreshold(newItem.Threshold) ?? 0,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setNewItem({
          Nama_Barang: '',
          Area: DEFAULT_AREAS[0],
          Satuan: 'pcs',
          Konversi_Isi: '',
          Konversi_Keterangan: '',
          Threshold: '0',
          Tipe_Input: 'dual',
          Keterangan: '',
        });
        fetchItems();
      } else {
        setErrorMsg(json.error?.message || 'Gagal menambahkan master item');
      }
    } catch (err: any) {
      setErrorMsg('Error: ' + err.message);
    } finally {
      setSavingItem(false);
    }
  };

  const handleSaveThreshold = async (itemId: string) => {
    if (!selectedCabang) return;
    try {
      const res = await fetch(`/api/master-item/${itemId}/threshold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          threshold: parseThreshold(tempThreshold) ?? 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingThreshold(null);
        fetchItems();
      }
    } catch (err: any) {
      setErrorMsg('Gagal mengubah threshold: ' + err.message);
    }
  };

  const handleSaveTipeInput = async (itemId: string) => {
    if (!selectedCabang) return;
    try {
      const res = await fetch(`/api/master-item/${itemId}/tipe-input`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          tipeInput: tempTipeInput,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingTipeInput(null);
        fetchItems();
      }
    } catch (err: any) {
      setErrorMsg('Gagal mengubah tipe input: ' + err.message);
    }
  };

  const handleSaveKeterangan = async (itemId: string) => {
    if (!selectedCabang) return;
    try {
      const res = await fetch(`/api/master-item/${itemId}/keterangan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          keterangan: tempKeterangan,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingKeterangan(null);
        fetchItems();
      }
    } catch (err: any) {
      setErrorMsg('Gagal mengubah keterangan: ' + err.message);
    }
  };

  const handleToggleActive = async (itemId: string, currentAktif: boolean) => {
    if (!selectedCabang) return;
    try {
      const res = await fetch(`/api/master-item/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          aktif: !currentAktif,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchItems();
      }
    } catch (err: any) {
      setErrorMsg('Gagal mengubah status item: ' + err.message);
    }
  };

  // ─── Kelola Kategori (admin only) ───
  const [showKategoriModal, setShowKategoriModal] = useState<boolean>(false);
  const [kategoriError, setKategoriError] = useState<string>('');
  const [kategoriSaving, setKategoriSaving] = useState<boolean>(false);
  const [newKategoriName, setNewKategoriName] = useState<string>('');
  const [editingKategoriId, setEditingKategoriId] = useState<string | null>(null);
  const [tempKategoriName, setTempKategoriName] = useState<string>('');
  const [tempKategoriUrutan, setTempKategoriUrutan] = useState<string>('');

  const activeKategoriNames = useMemo(
    () => kategoriList.filter((k) => k.Aktif).map((k) => k.Nama_Kategori),
    [kategoriList]
  );

  const handleAddKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCabang) return;
    const nama = newKategoriName.trim();
    if (!nama) return;
    try {
      setKategoriSaving(true);
      setKategoriError('');
      const res = await fetch('/api/master-item/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabangId: selectedCabang.Cabang_ID, Nama_Kategori: nama }),
      });
      const json = await res.json();
      if (json.success) {
        setNewKategoriName('');
        await fetchKategori();
      } else {
        setKategoriError(json.error?.message || 'Gagal menambah kategori');
      }
    } catch (err: any) {
      setKategoriError('Error: ' + err.message);
    } finally {
      setKategoriSaving(false);
    }
  };

  const handleSaveKategori = async (k: KategoriItem) => {
    if (!selectedCabang) return;
    const nama = tempKategoriName.trim();
    const urutan = Number(tempKategoriUrutan);
    if (!nama) return;
    try {
      setKategoriSaving(true);
      setKategoriError('');
      const res = await fetch(`/api/master-item/kategori/${k.Kategori_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          Nama_Kategori: nama,
          Urutan: Number.isFinite(urutan) ? urutan : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingKategoriId(null);
        await fetchKategori();
        if (json.data?.updatedAreas > 0) await fetchItems();
      } else {
        setKategoriError(json.error?.message || 'Gagal menyimpan kategori');
      }
    } catch (err: any) {
      setKategoriError('Error: ' + err.message);
    } finally {
      setKategoriSaving(false);
    }
  };

  const handleToggleKategoriActive = async (k: KategoriItem) => {
    if (!selectedCabang) return;
    try {
      setKategoriError('');
      const res = await fetch(`/api/master-item/kategori/${k.Kategori_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          Aktif: !k.Aktif,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchKategori();
      } else {
        setKategoriError(json.error?.message || 'Gagal mengubah status kategori');
      }
    } catch (err: any) {
      setKategoriError('Error: ' + err.message);
    }
  };

  const areas = useMemo(() => {
    const areaSet = new Set(items.map(i => i.Area || 'Area Umum'));
    if (activeKategoriNames.length > 0) {
      activeKategoriNames.forEach(a => areaSet.add(a));
    } else if (areaSet.size === 0) {
      DEFAULT_AREAS.forEach(a => areaSet.add(a));
    }
    return Array.from(areaSet).sort();
  }, [activeKategoriNames, items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesArea = selectedArea === 'Semua' || (item.Area || 'Area Umum') === selectedArea;
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        item.Nama_Barang.toLowerCase().includes(query) ||
        item.Item_ID.toLowerCase().includes(query) ||
        item.Area.toLowerCase().includes(query);
      return matchesArea && matchesSearch;
    });
  }, [items, selectedArea, searchQuery]);

  const groupedByArea = useMemo(() => {
    const groups: Array<{ area: string; items: MasterItem[] }> = [];
    const byArea = new Map<string, MasterItem[]>();
    filteredItems.forEach((it) => {
      const key = it.Area || 'Area Umum';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key)!.push(it);
    });
    byArea.forEach((items, area) => groups.push({ area, items }));
    return groups;
  }, [filteredItems]);

  const activeFilterCount = (selectedArea !== 'Semua' ? 1 : 0) + (searchQuery ? 1 : 0);

  if (!selectedCabang) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-warning" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-base-content">Pilih Cabang Terlebih Dahulu</h3>
          <p className="text-sm text-base-content/50 mt-1">Pilih cabang dari menu untuk mengelola master item.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6 space-y-5">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 data-onboard="master-heading" className="text-xl font-bold tracking-tight text-base-content">
                Master Threshold
              </h1>
              <p className="text-sm text-base-content/50">
                {selectedCabang.Nama_Cabang} &middot; Atur batas minimum stok semua item
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/docs/user-guide/master-item"
            className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-primary"
            title="Buka panduan Master Item"
          >
            <HelpCircle className="w-4 h-4" />
          </a>
          {isAdmin && (
            <button
              onClick={() => setShowKategoriModal(true)}
              className="btn btn-secondary btn-sm gap-1.5 shadow-sm"
            >
              <Tags className="w-4 h-4" />
              Kelola Kategori
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary btn-sm gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Item
          </button>
        </div>
      </div>

      {/* ─── INFO BANNER ─── */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-3 flex items-start gap-3">
        <CircleDot className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-sm text-base-content/70 leading-relaxed">
          Ubah angka di kolom <strong>Threshold Baru</strong>, lalu simpan. Semua sheet SO akan otomatis menggunakan threshold baru.
        </p>
      </div>

      {/* ─── ERROR ─── */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="alert alert-error text-sm rounded-lg"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => { setErrorMsg(''); fetchItems(); }} className="btn btn-ghost btn-xs">
              Muat ulang
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TOOLBAR ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Cari nama barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered input-sm w-full pl-9 pr-8 text-sm bg-base-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-base-content/30 hover:text-base-content transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-base-content/40" />
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="select select-bordered select-sm pl-9 pr-8 text-sm font-medium bg-base-100"
          >
            <option value="Semua">Semua Area</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/40">{filteredItems.length} dari {items.length} item</span>
            <button
              onClick={() => { setSelectedArea('Semua'); setSearchQuery(''); }}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Reset filter
            </button>
          </div>
        )}
      </div>

      {/* ─── TABLE ─── */}
      <div className="bg-base-100 border border-base-300 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm text-base-content/50">Memuat data barang...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center">
              <Package className="w-7 h-7 text-base-content/30" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold text-base-content">
                {items.length === 0 ? 'Belum Ada Item' : 'Tidak ada hasil'}
              </h3>
              <p className="text-sm text-base-content/50 mt-1">
                {items.length === 0
                  ? 'Tambahkan master barang untuk memulai pencatatan SO.'
                  : 'Ubah filter atau kata kunci pencarian.'}
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={() => { setSelectedArea('Semua'); setSearchQuery(''); }}
                className="btn btn-ghost btn-xs text-primary"
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-300 bg-base-200/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-base-content/50 uppercase tracking-wider w-10">
                    No
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                    Nama Barang
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-base-content/50 uppercase tracking-wider w-16">
                    Satuan
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-base-content/50 uppercase tracking-wider w-28">
                    Tipe Input
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-base-content/50 uppercase tracking-wider w-20">
                    Threshold
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-base-content/50 uppercase tracking-wider w-32">
                    Threshold Baru
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                    Keterangan
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-base-content/50 uppercase tracking-wider w-16">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-base-content/50 uppercase tracking-wider w-20">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {groupedByArea.map((group) => (
                  <React.Fragment key={group.area}>
                    {/* Area divider */}
                    <tr>
                      <td colSpan={10} className="px-4 py-2 bg-base-200/30">
                        <span className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                          <ChevronDown className="w-3.5 h-3.5" />
                          {group.area}
                          <span className="text-base-content/30 font-normal normal-case tracking-normal">
                            ({group.items.length} item)
                          </span>
                        </span>
                      </td>
                    </tr>
                    {/* Items */}
                    {group.items.map((item, idx) => (
                      <tr
                        key={item.Item_ID}
                        className="hover:bg-base-200/30 transition-colors group/row"
                      >
                        <td className="px-4 py-3 text-base-content/40 text-xs tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-base-content">{item.Nama_Barang}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-base-content/60 bg-base-200/50 px-2 py-0.5 rounded-md">
                            {item.Area}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-base-content/50 font-mono">
                          {item.Satuan}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingTipeInput === item.Item_ID ? (
                            <div className="flex items-center justify-center gap-1">
                              <select
                                value={tempTipeInput}
                                onChange={(e) => setTempTipeInput(e.target.value)}
                                className="select select-bordered select-xs min-h-0 h-7 text-xs w-full max-w-[120px]"
                                autoFocus
                              >
                                {TIPE_OPTIONS.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleSaveTipeInput(item.Item_ID)}
                                className="btn btn-success btn-xs min-h-0 h-6 px-1.5"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingTipeInput(null)}
                                className="btn btn-ghost btn-xs min-h-0 h-6 px-1.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingTipeInput(item.Item_ID);
                                setTempTipeInput(item.Tipe_Input || 'dual');
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${tipeBadgeColor(item.Tipe_Input)}`}
                            >
                              {item.Tipe_Input || 'dual'}
                              <Edit3 className="w-3 h-3 opacity-0 group-hover/row:opacity-60 transition-opacity" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md bg-base-200/50 text-sm font-semibold tabular-nums text-base-content/70">
                            {item.Threshold}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingThreshold === item.Item_ID ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={tempThreshold}
                                onChange={(e) => setTempThreshold(sanitizeDecimalInput(e.target.value))}
                                className="input input-bordered input-xs w-20 text-center tabular-nums font-semibold text-sm min-h-0 h-7"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveThreshold(item.Item_ID)}
                                className="btn btn-success btn-xs min-h-0 h-6 px-1.5"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingThreshold(null)}
                                className="btn btn-ghost btn-xs min-h-0 h-6 px-1.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingThreshold(item.Item_ID);
                                setTempThreshold(String(item.Threshold));
                              }}
                              className="inline-flex items-center justify-center gap-1.5 min-w-[2.5rem] px-2 py-0.5 rounded-md bg-warning/10 border border-warning/20 text-sm font-bold tabular-nums text-warning-content cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {item.Threshold}
                              <Edit3 className="w-3 h-3 opacity-0 group-hover/row:opacity-60 transition-opacity" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingKeterangan === item.Item_ID ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempKeterangan}
                                onChange={(e) => setTempKeterangan(e.target.value)}
                                placeholder="Catatan..."
                                className="input input-bordered input-xs flex-1 text-xs min-h-0 h-7"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveKeterangan(item.Item_ID)}
                                className="btn btn-success btn-xs min-h-0 h-6 px-1.5"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingKeterangan(null)}
                                className="btn btn-ghost btn-xs min-h-0 h-6 px-1.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingKeterangan(item.Item_ID);
                                setTempKeterangan(item.Keterangan || '');
                              }}
                              className="text-left text-xs text-base-content/50 hover:text-base-content max-w-[150px] truncate transition-colors cursor-pointer group/ket"
                            >
                              {item.Keterangan || <span className="italic opacity-40">Tambah catatan...</span>}
                              <Edit3 className="w-3 h-3 inline ml-1 opacity-0 group-hover/ket:opacity-50 transition-opacity" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.Aktif ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-base-200 text-base-content/40">
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleActive(item.Item_ID, item.Aktif)}
                            title={item.Aktif ? "Nonaktifkan item" : "Aktifkan item"}
                            className={`btn btn-xs min-h-0 h-6 px-2 text-xs font-medium transition-colors ${
                              item.Aktif
                                ? 'btn-ghost text-error/70 hover:text-error hover:bg-error/10'
                                : 'btn-ghost text-success/70 hover:text-success hover:bg-success/10'
                            }`}
                          >
                            {item.Aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ADD ITEM MODAL ─── */}
      <AnimatePresence>
        {showModal && (
          <dialog className="modal modal-open">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="modal-box max-w-lg p-0"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-base-content">Tambah Item Baru</h3>
                    <p className="text-xs text-base-content/50">Isi data master item untuk cabang ini</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleAddItem} className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                    Nama Barang <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Beras Pandan Wangi 5kg"
                    value={newItem.Nama_Barang}
                    onChange={(e) => setNewItem({ ...newItem, Nama_Barang: e.target.value })}
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                      Area <span className="text-error">*</span>
                    </label>
                    <select
                      value={newItem.Area}
                      onChange={(e) => setNewItem({ ...newItem, Area: e.target.value })}
                      className="select select-bordered w-full text-sm"
                    >
                      {areas.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                      Satuan <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="kg, pcs, gr..."
                      value={newItem.Satuan}
                      onChange={(e) => setNewItem({ ...newItem, Satuan: e.target.value })}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                      Tipe Input
                    </label>
                    <select
                      value={newItem.Tipe_Input}
                      onChange={(e) => setNewItem({ ...newItem, Tipe_Input: e.target.value })}
                      className="select select-bordered w-full text-sm"
                    >
                      {TIPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                      Threshold (Batas Minimum)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newItem.Threshold}
                      onChange={(e) => setNewItem({ ...newItem, Threshold: sanitizeDecimalInput(e.target.value) })}
                      className="input input-bordered w-full text-sm font-semibold tabular-nums"
                    />
                    <p className="text-xs text-base-content/40">Threshold = 0 berarti tidak dipantau</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                      Keterangan
                    </label>
                    <input
                      type="text"
                      placeholder="Catatan (opsional)"
                      value={newItem.Keterangan}
                      onChange={(e) => setNewItem({ ...newItem, Keterangan: e.target.value })}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-base-300">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingItem}
                    className="btn btn-primary btn-sm gap-1.5"
                  >
                    {savingItem ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Simpan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setShowModal(false)}>close</button>
            </form>
          </dialog>
        )}
      </AnimatePresence>

      {/* ─── KELOLA KATEGORI MODAL (admin only) ─── */}
      <AnimatePresence>
        {showKategoriModal && (
          <dialog className="modal modal-open">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="modal-box max-w-lg p-0"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Tags className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-base-content">Kelola Kategori</h3>
                    <p className="text-xs text-base-content/50">
                      {selectedCabang.Nama_Cabang} &middot; Kategori untuk grouping item
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowKategoriModal(false); setEditingKategoriId(null); }}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddKategori} className="px-6 pt-4 pb-3 border-b border-base-300 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nama kategori baru..."
                  value={newKategoriName}
                  onChange={(e) => setNewKategoriName(e.target.value)}
                  className="input input-bordered flex-1 text-sm"
                />
                <button type="submit" disabled={kategoriSaving} className="btn btn-secondary btn-sm gap-1.5">
                  {kategoriSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Tambah
                </button>
              </form>

              <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
                {kategoriError && (
                  <div className="alert alert-error text-xs rounded-lg mb-3" role="alert">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{kategoriError}</span>
                    <button onClick={() => setKategoriError('')} className="btn btn-ghost btn-xs">Tutup</button>
                  </div>
                )}

                {kategoriLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                    <p className="text-xs text-base-content/50">Memuat kategori...</p>
                  </div>
                ) : kategoriList.length === 0 ? (
                  <p className="text-sm text-base-content/50 text-center py-8">
                    Belum ada kategori. Tambahkan kategori pertama di atas.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {kategoriList.map((k) => (
                      <li
                        key={k.Kategori_ID}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                          k.Aktif ? 'border-base-300 bg-base-100' : 'border-base-300 bg-base-200/40 opacity-70'
                        }`}
                      >
                        {editingKategoriId === k.Kategori_ID ? (
                          <>
                            <input
                              type="text"
                              value={tempKategoriName}
                              onChange={(e) => setTempKategoriName(e.target.value)}
                              className="input input-bordered input-xs flex-1 min-w-0 text-sm"
                              autoFocus
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              value={tempKategoriUrutan}
                              onChange={(e) => setTempKategoriUrutan(e.target.value.replace(/[^\d]/g, ''))}
                              placeholder="Urutan"
                              className="input input-bordered input-xs w-16 text-center text-xs tabular-nums"
                            />
                            <button
                              onClick={() => handleSaveKategori(k)}
                              disabled={kategoriSaving}
                              className="btn btn-success btn-xs min-h-0 h-7 px-2"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingKategoriId(null)}
                              className="btn btn-ghost btn-xs min-h-0 h-7 px-2"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-base-content truncate">{k.Nama_Kategori}</p>
                              <p className="text-xs text-base-content/40">{k.Kategori_ID}</p>
                            </div>
                            {!k.Aktif && (
                              <span className="badge badge-ghost badge-xs text-base-content/50">Nonaktif</span>
                            )}
                            <button
                              onClick={() => {
                                setEditingKategoriId(k.Kategori_ID);
                                setTempKategoriName(k.Nama_Kategori);
                                setTempKategoriUrutan(String(k.Urutan));
                              }}
                              className="btn btn-ghost btn-xs min-h-0 h-7 px-2 text-base-content/60"
                              title="Ubah nama / urutan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleKategoriActive(k)}
                              disabled={kategoriSaving}
                              className={`btn btn-xs min-h-0 h-7 px-2 ${
                                k.Aktif
                                  ? 'btn-ghost text-error/70 hover:text-error hover:bg-error/10'
                                  : 'btn-ghost text-success/70 hover:text-success hover:bg-success/10'
                              }`}
                              title={k.Aktif ? 'Nonaktifkan kategori' : 'Aktifkan kategori'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-6 py-3 border-t border-base-300 flex justify-end">
                <button
                  onClick={() => { setShowKategoriModal(false); setEditingKategoriId(null); }}
                  className="btn btn-ghost btn-sm"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => { setShowKategoriModal(false); setEditingKategoriId(null); }}>close</button>
            </form>
          </dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
