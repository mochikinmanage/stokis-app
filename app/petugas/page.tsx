'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import { useAuth } from '@/lib/AuthContext';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  X,
  ShieldAlert,
  Shield,
  Key,
  AlertTriangle,
  Store,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { QuantumLoaderFull } from '@/components/ui/QuantumLoader';

interface User {
  User_ID: string;
  Username: string;
  Nama: string;
  Role: string;
  Cabang_ID: string;
  Aktif: boolean | string;
}

const emptyForm = {
  username: '',
  nama: '',
  role: 'petugas',
  pin: '',
  cabangIds: [] as string[],
};

export default function PetugasPage() {
  const { allCabangList } = useCabang();
  const { user: currentUser } = useAuth();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsersList(json.data);
      } else {
        setErrorMsg(json.error?.message || 'Gagal memuat daftar pengguna.');
      }
    } catch {
      setErrorMsg('Gagal memuat daftar pengguna. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const cabangName = (id: string) => {
    const match = allCabangList.find((c) => c.Cabang_ID === id);
    return match ? match.Nama_Cabang : id;
  };

  const parseCabangIds = (raw: string) =>
    String(raw || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toUpperCase());

  const isOwnUser = (u: User) =>
    !!currentUser && currentUser.username?.toLowerCase() === String(u.Username || '').toLowerCase();

  const handleOpenAdd = () => {
    setEditingUser(null);
    setForm({ ...emptyForm, cabangIds: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setForm({
      username: u.Username,
      nama: u.Nama,
      role: u.Role,
      pin: '',
      cabangIds: parseCabangIds(u.Cabang_ID),
    });
    setShowModal(true);
  };

  const toggleCabang = (id: string) => {
    setForm((f) => ({
      ...f,
      cabangIds: f.cabangIds.includes(id)
        ? f.cabangIds.filter((c) => c !== id)
        : [...f.cabangIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');

      const cabangId = form.cabangIds.join(', ');
      if (editingUser) {
        const payload: Record<string, unknown> = { nama: form.nama, role: form.role, cabangId };
        if (form.pin) payload.pin = form.pin;
        const res = await fetch(`/api/users/${editingUser.User_ID}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Gagal menyimpan perubahan');
        setSuccessMsg('Data pengguna berhasil diperbarui.');
      } else {
        if (!form.username.trim()) throw new Error('Username wajib diisi');
        if (!form.pin.trim()) throw new Error('PIN wajib diisi');
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username.trim(),
            pin: form.pin.trim(),
            nama: form.nama,
            role: form.role,
            cabangId,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Gagal menambah pengguna');
        setSuccessMsg('Pengguna baru berhasil ditambahkan.');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      setErrorMsg('');
      const res = await fetch(`/api/users/${u.User_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktif: !(u.Aktif === true || u.Aktif === 'true' || u.Aktif === 'TRUE') }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Gagal mengubah status');
      setSuccessMsg(`Pengguna ${u.Username} ${u.Aktif ? 'dinonaktifkan' : 'diaktifkan'}.`);
      fetchUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengubah status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setErrorMsg('');
      const res = await fetch(`/api/users/${deleteTarget.User_ID}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Gagal menghapus pengguna');
      setSuccessMsg(`Pengguna ${deleteTarget.Username} berhasil dihapus.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <QuantumLoaderFull text="Memuat daftar pengguna" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-base-content flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Manajemen Pengguna</span>
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Kelola seluruh akun login (admin & petugas) di semua cabang.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenAdd}
          className="btn btn-primary gap-2 px-4 py-2 text-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </motion.button>
      </motion.div>

      {errorMsg && (
        <div className="alert alert-error text-sm" role="alert">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => { setErrorMsg(''); fetchUsers(); }} className="btn btn-ghost btn-xs">
            Coba Lagi
          </button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success text-sm" role="status">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="btn btn-ghost btn-xs">Tutup</button>
        </div>
      )}

      <div>
        {usersList.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Users className="w-12 h-12 text-base-content/40 mx-auto" />
            <h3 className="text-sm font-semibold text-base-content">Belum Ada Pengguna</h3>
            <p className="text-base-content/60 text-sm">Tambahkan pengguna baru untuk memberi akses login.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mobile-card-table">
              <thead className="bg-base-200 border-b border-base-300">
                <tr className="font-semibold text-base-content/60">
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Nama Lengkap</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Cabang</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-base-content">
                {usersList.map((u) => {
                  const own = isOwnUser(u);
                  return (
                    <motion.tr
                      key={u.User_ID}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.1 }}
                      className="border-b border-base-300 hover:bg-base-200 transition-colors"
                    >
                      <td className="px-5 py-4" data-label="Username">
                        <span className="font-semibold text-primary">{u.Username}</span>
                        {own && <span className="badge badge-ghost badge-xs ml-2">Anda</span>}
                      </td>
                      <td className="px-5 py-4" data-label="Nama">{u.Nama}</td>
                      <td className="px-5 py-4" data-label="Role">
                        {u.Role === 'admin' ? (
                          <span className="badge badge-primary gap-1">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="badge badge-ghost gap-1">
                            <Key className="w-3 h-3" /> Petugas
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4" data-label="Cabang">
                        <div className="flex flex-wrap gap-1">
                          {parseCabangIds(u.Cabang_ID).length === 0 ? (
                            <span className="text-base-content/40 text-xs">-</span>
                          ) : (
                            parseCabangIds(u.Cabang_ID).map((id) => (
                              <span key={id} className="badge badge-outline badge-sm gap-1">
                                <Store className="w-3 h-3" /> {cabangName(id)}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center" data-label="Status">
                        {u.Aktif === true || u.Aktif === 'true' || u.Aktif === 'TRUE' ? (
                          <span className="badge badge-success">Aktif</span>
                        ) : (
                          <span className="badge badge-ghost">Nonaktif</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1" data-label="Aksi">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-ghost btn-xs text-base-content/60 hover:text-primary"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="btn btn-ghost btn-xs text-warning hover:bg-warning/10"
                          title={u.Aktif === true ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {u.Aktif === true ? 'Nonaktifkan' : 'Aktifkan'}
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          disabled={own}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 disabled:text-base-content/30 disabled:cursor-not-allowed"
                          title={own ? 'Tidak bisa menghapus akun sendiri' : 'Hapus Pengguna'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showModal && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <div className="flex items-center justify-between pb-4 border-b border-base-300">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-base-content" />
                  <h3 className="text-lg font-semibold text-base-content">
                    {editingUser ? `Edit Pengguna: ${editingUser.Username}` : 'Tambah Pengguna Baru'}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {!editingUser && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-base-content/70">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="Username untuk login"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-base-content/70">
                    {editingUser ? 'PIN Baru (kosongkan jika tidak diubah / reset)' : 'PIN (6 digit)'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder="123456"
                    maxLength={6}
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })}
                    className="input input-bordered w-full text-sm font-mono"
                  />
                  <p className="text-xs text-base-content/50 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Jangan gunakan PIN yang mudah ditebak; PIN disimpan apa adanya di spreadsheet.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-base-content/70">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-base-content/70">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="select select-bordered w-full text-sm"
                  >
                    <option value="petugas">Petugas</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-base-content/70">
                    Cabang (boleh pilih lebih dari satu)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-base-300 rounded-lg p-3">
                    {allCabangList.length === 0 ? (
                      <p className="text-sm text-base-content/50 col-span-full">Belum ada cabang terdaftar.</p>
                    ) : (
                      allCabangList.map((c) => {
                        const checked = form.cabangIds.includes(c.Cabang_ID.toUpperCase());
                        return (
                          <label
                            key={c.Cabang_ID}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border text-sm transition-colors ${
                              checked
                                ? 'border-primary bg-primary/10'
                                : 'border-base-300 hover:bg-base-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCabang(c.Cabang_ID.toUpperCase())}
                              className="checkbox checkbox-primary checkbox-sm"
                            />
                            <span className="font-medium">{c.Nama_Cabang}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {editingUser && isOwnUser(editingUser) && form.role !== 'admin' && (
                  <div className="alert alert-warning text-sm">
                    <ShieldAlert className="w-4 h-4" /> Anda sedang mengubah akun sendiri ke role non-admin.
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="btn btn-primary"
                  >
                    {saving ? (
                      <>
                        <div className="quantum-mini-loader">
                          <span />
                          <span />
                          <span />
                        </div>
                        <span>Menyimpan...</span>
                      </>
                    ) : editingUser ? (
                      'Simpan Perubahan'
                    ) : (
                      'Tambah Pengguna'
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setShowModal(false)}>close</button>
            </form>
          </dialog>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <div className="flex items-center justify-between pb-4 border-b border-base-300">
                <div className="flex items-center gap-2 text-error">
                  <Trash2 className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Hapus Pengguna</h3>
                </div>
                <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost btn-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="py-4 space-y-2">
                <p className="text-sm text-base-content">
                  Anda yakin ingin menghapus pengguna{' '}
                  <span className="font-semibold">{deleteTarget.Username}</span> (
                  {deleteTarget.Nama}) secara permanen?
                </p>
                <p className="text-xs text-error font-medium">
                  Tindakan ini tidak dapat dibatalkan dan menghapus baris dari spreadsheet.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost">Batal</button>
                <motion.button
                  onClick={handleDelete}
                  disabled={deleting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="btn btn-error"
                >
                  {deleting ? 'Menghapus...' : 'Yakin, Hapus'}
                </motion.button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setDeleteTarget(null)}>close</button>
            </form>
          </dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
