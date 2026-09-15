export interface TourStep {
  id: string;
  title: string;
  description: string;
  /** CSS selector of the element to highlight. If null/center, show a centered popover. */
  selector?: string;
  /** Route to navigate to before showing this step (must match the page where the selector lives). */
  path?: string;
  /** Placement of the popover relative to the highlighted element. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Optional role restriction: step is shown only to matching roles. */
  roles?: Array<'admin' | 'petugas'>;
}

export interface TourDefinition {
  id: string;
  enabled: boolean;
  steps: TourStep[];
}

const STORAGE_KEY = 'stokis:onboarding-done:v1';

export function isTourDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markTourDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    /* ignore */
  }
}

export function resetTourDone(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export type UserRole = 'admin' | 'petugas';

/** Saring langkah tur berdasarkan role user; langkah tanpa `roles` selalu ikut. */
export function getTourStepsForRole(user: {
  role?: string;
} | null): TourStep[] {
  const role = user?.role ?? 'petugas';
  const normalized: UserRole = role === 'admin' ? 'admin' : 'petugas';
  return ONBOARDING_TOUR.steps.filter(
    (s) => !s.roles || s.roles.includes(normalized),
  );
}

/**
 * Tur onboarding utama. Urutan langkah mengikuti alur pengguna baru:
 * mulai dari beranda, lalu menyusuri halaman-halaman utama.
 *
 * Elemen di-highlight memakai atribut `data-onboard` agar tidak rapuh
 * terhadap perubahan class. Untuk langkah di halaman lain, tour akan
 * menavigasi ke `path` tersebut terlebih dahulu.
 */
export const ONBOARDING_TOUR: TourDefinition = {
  id: 'stokis-onboarding',
  enabled: true,
  steps: [
    {
      id: 'welcome',
      title: 'Selamat datang di Stokis 👋',
      description:
        'Ini adalah tutorial singkat untuk mengenalkan Anda pada fitur utama aplikasi. Klik "Berikutnya" untuk melanjutkan, atau "Lewati" untuk menutup tutorial.',
      placement: 'center',
    },
    {
      id: 'nav',
      title: 'Navigasi Aplikasi',
      description:
        'Menu di bagian atas (atau bawah di ponsel) adalah pintu utama ke semua fitur: Input SO, Laporan, Item, Petugas, Cabang, dan Dashboard.',
      selector: '[data-onboard="nav"]',
      placement: 'bottom',
      path: '/',
    },
    {
      id: 'cabang',
      title: 'Pilih Cabang',
      description:
        'Gunakan dropdown ini untuk memilih cabang yang sedang dikerjakan. Seluruh data pada halaman akan mengikuti cabang yang dipilih.',
      selector: '[data-onboard="cabang"]',
      placement: 'bottom',
    },
    {
      id: 'so-input',
      title: 'Input Stock Opname (SO)',
      description:
        'Halaman ini adalah tempat mencatat hasil stock opname. Mari kita lihat setiap bagiannya satu per satu.',
      selector: '[data-onboard="so-input-heading"]',
      placement: 'bottom',
      path: '/so/input',
    },
    {
      id: 'so-tanggal',
      title: 'Tanggal Operasional',
      description:
        'Isi tanggal operasional saat pencatatan dilakukan. Secara otomatis menampilkan tanggal hari ini.',
      selector: '[data-onboard="so-tanggal"]',
      placement: 'bottom',
    },
    {
      id: 'so-shift',
      title: 'Pilih Shift Kerja',
      description:
        'Pilih shift kerja: Opening (pagi) atau Closing (sore/malam). Setiap shift dicatat terpisah.',
      selector: '[data-onboard="so-shift"]',
      placement: 'bottom',
    },
    {
      id: 'so-petugas',
      title: 'Petugas',
      description:
        'Nama petugas diambil otomatis dari akun yang sedang login dan tidak dapat diubah.',
      selector: '[data-onboard="so-petugas"]',
      placement: 'bottom',
    },
    {
      id: 'so-previous',
      title: 'Acuan SO Sebelumnya',
      description:
        'Pilih laporan SO sebelumnya sebagai pembanding. Nilai stok lama akan tampil di kolom abu-abu agar mudah dibandingkan dengan stok sekarang.',
      selector: '[data-onboard="so-previous"]',
      placement: 'bottom',
    },
    {
      id: 'so-search',
      title: 'Cari Barang',
      description:
        'Gunakan kolom pencarian untuk menemukan barang dengan cepat berdasarkan nama barang atau kode item.',
      selector: '[data-onboard="so-search"]',
      placement: 'bottom',
    },
    {
      id: 'so-area',
      title: 'Filter Area',
      description:
        'Filter untuk menampilkan barang hanya pada area tertentu (misalnya rak, gudang, atau display).',
      selector: '[data-onboard="so-area"]',
      placement: 'bottom',
    },
    {
      id: 'so-step',
      title: 'Isi Jumlah Stok (S1 & S2)',
      description:
        'Untuk setiap barang, isi jumlah stok pada kolom S1 dan S2. Kolom Tot menampilkan total otomatis. Kolom abu-abu (SO sebelumnya) adalah pembanding.',
      selector: '[data-onboard="so-step"]',
      placement: 'bottom',
    },
    {
      id: 'so-keterangan',
      title: 'Keterangan (Opsional)',
      description:
        'Anda dapat menambahkan catatan untuk setiap barang, misalnya alasan selisih stok atau kondisi barang.',
      selector: '[data-onboard="so-keterangan"]',
      placement: 'bottom',
    },
    {
      id: 'so-navrail',
      title: 'Navigasi Cepat Antar Item',
      description:
        'Panel di sisi kanan membantu berpindah cepat ke item pertama, item terakhir yang diisi, dan item paling bawah.',
      selector: '[data-onboard="so-navrail"]',
      placement: 'left',
    },
    {
      id: 'so-submit',
      title: 'Simpan & Buat Laporan',
      description:
        'Setelah semua stok diisi, tekan tombol ini untuk menyimpan dan menghasilkan laporan. File Excel (XLSX) akan diunduh otomatis.',
      selector: '[data-onboard="so-submit"]',
      placement: 'top',
    },
    {
      id: 'dashboard',
      title: 'Dashboard & Laporan',
      description:
        'Halaman Dashboard menampilkan ringkasan stok (kritis, hampir habis, aman) dalam bentuk grafik. Halaman Laporan menyimpan arsip laporan SO yang dapat diunduh sebagai XLSX atau dikirim via WhatsApp.',
      selector: '[data-onboard="dashboard-heading"]',
      placement: 'bottom',
      path: '/dashboard/harian',
      roles: ['admin'],
    },
    {
      id: 'done',
      title: 'Siap digunakan! 🎉',
      description:
        'Anda sudah siap menggunakan Stokis. Kapan saja Anda dapat membuka kembali panduan ini lewat tombol "Tutorial" di navigasi.',
      placement: 'center',
    },
  ],
};
