# Sistem save draft data di app

**Session ID:** ses_f4b3037ebffeP9JDLNjr4TJJ1C
**Created:** 9/18/2026, 8:58:31 PM
**Updated:** 9/18/2026, 9:11:13 PM

---

## User

bagaimana sistem save draft data di app ini?

---

## Assistant (Plan · Big Pickle · 4.9s)

_Thinking:_

The user asks in Indonesian: "bagaimana sistem save draft data di app ini?" - "how does the save draft data system work in this app?"

This is a question about the codebase. I'm in plan mode, read-only. Let me explore the codebase to understand how draft saving works. Let me search for "draft" related code.

**Tool: grep**

**Input:**
```json
{
  "pattern": "draft",
  "path": "/home/bradley/project/stokis-project",
  "include": "*.ts"
}
```

**Output:**
```
No files found
```

**Tool: grep**

**Input:**
```json
{
  "pattern": "draft",
  "path": "/home/bradley/project/stokis-project",
  "include": "*.tsx"
}
```

**Output:**
```
Found 77 matches
/home/bradley/project/stokis-project/app/page.tsx:
  Line 290:                   perbandingan data sebelumnya, dan draft autosave per cabang.


/home/bradley/project/stokis-project/app/docs/getting-started/page.tsx:
  Line 169:             "Jika browser tertutup atau HP mati saat mengisi SO, data draft tersimpan otomatis di browser. Buka kembali halaman Input SO dan klik \"Lanjutkan Draft\".",

  Line 170:             "If the browser closes or phone dies while filling SO, draft data is saved automatically in the browser. Re-open the Input SO page and click \"Restore Draft\"."


/home/bradley/project/stokis-project/app/so/input/welcome/page.tsx:
  Line 18: const DRAFT_PREFIX = 'stokis_so_draft_';

  Line 76:     const draftCabangId = selectedCabang?.Cabang_ID || user.cabangId;

  Line 77:     if (draftCabangId) {

  Line 78:       const cached = loadDraft(draftCabangId);

  Line 88:     // The input page will automatically load the draft

  Line 93:     // Clear draft and show ShiftCabangGate first

  Line 123:       const draft = loadDraft(selectedCabang.Cabang_ID);

  Line 124:       if (draft?.shift) return draft.shift;

  Line 136:     const draft = loadDraft(cabangId);

  Line 137:     return draft?.shift ?? null;

  Line 182:         {/* Session Info - only show if draft exists */}


/home/bradley/project/stokis-project/components/ShiftCabangGate.tsx:
  Line 32:   const draftShift = cabangId ? getDraftShift(cabangId) : null;

  Line 33:   const hasDraftMismatch = !!draftShift && shift !== draftShift;

  Line 182:                       Ada draft tersimpan untuk shift <strong>{draftShift}</strong> pada cabang ini.


/home/bradley/project/stokis-project/app/docs/changelog/page.tsx:
  Line 76:       { type: "added", en: "SO form with auto-save draft", id: "Form SO dengan auto-save draft" },


/home/bradley/project/stokis-project/app/so/input/page.tsx:
  Line 145: const DRAFT_PREFIX = 'stokis_so_draft_';

  Line 184: function saveDraft(cabangId: string, draft: SODraft): void {

  Line 188:       JSON.stringify({ ...draft, updatedAt: Date.now() }),

  Line 575:   const draftTimer = useRef<number | null>(null);

  Line 589:   const handleRestoreDraft = (draft: SODraft) => {

  Line 590:     if (draft.sesiId) sesiIdRef.current = draft.sesiId;

  Line 591:     if (draft.tanggalOperasional) setTanggalOperasional(draft.tanggalOperasional);

  Line 592:     if (draft.shift) setShift(draft.shift);

  Line 593:     if (draft.note) setNote(draft.note);

  Line 596:       Object.keys(draft.counts).forEach((k) => {

  Line 597:         const dc = draft.counts[k];

  Line 645:             // Auto-restore draft instead of showing banner

  Line 685:   // Autosave draft (save sementara) ke localStorage, di-debounce

  Line 689:     // Jangan sentuh draft sebelum items dimuat atau sambil menunggu keputusan restore

  Line 692:     if (draftTimer.current) window.clearTimeout(draftTimer.current);

  Line 693:     draftTimer.current = window.setTimeout(() => {

  Line 712:       if (draftTimer.current) window.clearTimeout(draftTimer.current);

  Line 1057:       // Submit sukses → hapus draft sementara

  Line 1544:                   <h2 id="discard-title" className="font-bold text-base text-base-content">Hapus draft ini?</h2>


/home/bradley/project/stokis-project/app/docs/introduction/page.tsx:
  Line 143:               desc: t("Form multi-step dengan auto-save draft", "Multi-step form with auto-save draft"),


/home/bradley/project/stokis-project/app/master-item/page.tsx:
  Line 107:   const [draft, setDraft] = useState<Set<string>>(() => parseTipeSelection(value));

  Line 127:     onChange(tipeSelectionToComma(draft));

  Line 173:               const isSelected = draft.has(t);

  Line 278:   const [draftItems, setDraftItems] = useState<Map<string, MasterItem>>(new Map());

  Line 375:     if (!selectedCabang || draftItems.size === 0) return;

  Line 379:       const updates = [...draftItems.values()].map((d) => ({

  Line 392:         toast.success('Berhasil', `${draftItems.size} perubahan item berhasil disimpan.`);

  Line 971:                       const draft = isEditing ? (draftItems.get(item.Item_ID) || item) : item;

  Line 972:                       const isDirty = draftItems.has(item.Item_ID);

  Line 995:                                       value={draft.Tipe_Input || 'dual'}

  Line 1017:                                     value={draft.Threshold}

  Line 1031:                                       value={draft.Keterangan || ''}

  Line 1133:         {isAdmin && isEditing && draftItems.size > 0 && (

  Line 1138:                 <span className="text-sm font-semibold text-warning">{draftItems.size} item belum disimpan</span>

  Line 1365:                       const draft = isEditing ? (draftItems.get(item.Item_ID) || item) : item;

  Line 1366:                       const isDirty = draftItems.has(item.Item_ID);

  Line 1403:                               onClick={() => isEditing && openBottomSheet(item.Item_ID, draft.Tipe_Input || 'dual')}

  Line 1411:                                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${tipeBadgeColor(draft.Tipe_Input)}`}>

  Line 1412:                                   {draft.Tipe_Input || 'dual'}

  Line 1429:                                   value={draft.Threshold}

  Line 1445:                                 value={draft.Keterangan || ''}

  Line 1507:         {isAdmin && isEditing && draftItems.size > 0 && (

  Line 1512:                 <span className="text-xs font-semibold text-base-content/60">{draftItems.size} belum disimpan</span>


/home/bradley/project/stokis-project/app/docs/user-guide/stock-opname/page.tsx:
  Line 33:   { id: "draft", label: "Auto-Save Draft", level: 2 },

  Line 54:             "Formulir input stok fisik barang dengan alur multi-langkah dan auto-save draft.",

  Line 55:             "Physical stock input form with multi-step flow and auto-save draft."

  Line 120:                   "Jika ada draft tersimpan untuk kombinasi cabang+shift lain, muncul peringatan bahwa draft tersebut akan diabaikan.",

  Line 121:                   "If a saved draft exists for a different branch+shift combination, a warning appears that the draft will be ignored."

  Line 447:       <section id="draft" className="scroll-mt-32 space-y-4">

  Line 455:             "Sistem menyimpan draft otomatis ke localStorage browser setiap Anda mengisi angka. Draft disimpan per cabang.",

  Line 456:             "The system automatically saves drafts to browser localStorage every time you enter numbers. Drafts are saved per branch."

  Line 475:                 'Ketika membuka halaman Input SO dengan draft tersimpan, muncul banner peringatan. Klik "Lanjutkan" untuk memulihkan data atau "Buang & Mulai Baru" untuk menghapus draft.',

  Line 476:                 'When opening the Input SO page with a saved draft, a warning banner appears. Click "Continue" to restore data or "Discard & Start New" to delete the draft.'


/home/bradley/project/stokis-project/app/docs/faq/page.tsx:
  Line 183:               "Tenang! Data Anda aman. Stokis menggunakan auto-save draft di browser.",

  Line 184:               "Relax! Your data is safe. Stokis uses auto-save draft in the browser."

  Line 194:               <li>{t("Sistem akan menampilkan notifikasi draft ditemukan", "System will show notification that draft was found")}</li>


/home/bradley/project/stokis-project/components/docs/DocsSearch.tsx:
  Line 105:     keywords: ["draft", "auto-save", "otomatis", "simpan", "browser", "mati"],

  Line 106:     description: "Fitur penyimpanan draft otomatis",


/home/bradley/project/stokis-project/app/docs/troubleshooting/page.tsx:
  Line 136:               <li>{t("Sistem akan mendeteksi draft yang tersimpan", "The system will detect the saved draft")}</li>

```

---

## Assistant (Plan · Big Pickle · 6.8s)

_Thinking:_

Let me look at the main SO input draft implementation in app/so/input/page.tsx around the functions saveDraft, loadDraft, handleRestoreDraft, autosave. Let me read the relevant sections. Also the welcome page for loadDraft.

Let me read the relevant portions.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/app/so/input/page.tsx",
  "offset": 130,
  "limit": 120
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/app/so/input/page.tsx</path>
<type>file</type>
<content>
130:         body: JSON.stringify(body),
131:       });
132:       const json = (await res.json()) as ApiResult<T>;
133:       return { result: json };
134:     } catch (err) {
135:       lastErr = err;
136:       if (attempt < attempts - 1) {
137:         await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
138:       }
139:     }
140:   }
141:   throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
142: }
143: 
144: // ─── Draft persistence (save sementara agar tinggal lanjutkan setelah refresh) ───
145: const DRAFT_PREFIX = 'stokis_so_draft_';
146: 
147: interface SODraft {
148:   counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>;
149:   sesiId: string;
150:   tanggalOperasional: string;
151:   shift: string;
152:   note: string;
153:   updatedAt: number;
154: }
155: 
156: function getDraftKey(cabangId: string): string {
157:   return DRAFT_PREFIX + cabangId;
158: }
159: 
160: function countFilled(
161:   counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>,
162: ): number {
163:   return Object.keys(counts).reduce((n, k) => {
164:     const v = counts[k];
165:     const hasCount =
166:       String(v?.step1 ?? '').trim() !== '' || String(v?.step2 ?? '').trim() !== '' ||
167:       v?.statusIsi !== undefined || String(v?.tglRefill ?? '').trim() !== '' || String(v?.tglPakai ?? '').trim() !== '';
168:     return n + (hasCount ? 1 : 0);
169:   }, 0);
170: }
171: 
172: function loadDraft(cabangId: string): SODraft | null {
173:   try {
174:     const raw = localStorage.getItem(getDraftKey(cabangId));
175:     if (!raw) return null;
176:     const parsed = JSON.parse(raw) as SODraft;
177:     if (!parsed || typeof parsed !== 'object' || !parsed.counts) return null;
178:     return parsed;
179:   } catch {
180:     return null;
181:   }
182: }
183: 
184: function saveDraft(cabangId: string, draft: SODraft): void {
185:   try {
186:     localStorage.setItem(
187:       getDraftKey(cabangId),
188:       JSON.stringify({ ...draft, updatedAt: Date.now() }),
189:     );
190:   } catch {
191:     // Abaikan: mode privat / quota penuh tidak menghalangi input
192:   }
193: }
194: 
195: function clearDraft(cabangId: string): void {
196:   try {
197:     localStorage.removeItem(getDraftKey(cabangId));
198:   } catch {
199:     // abai
200:   }
201: }
202: 
203: /**
204:  * Verify that Link_XLSX has been saved to database and contains valid Drive link.
205:  * Poll /api/laporan/{laporanId}/wa-link endpoint until Link_XLSX is populated (max 5 retries, 2s interval).
206:  * 
207:  * Returns:
208:  *   - laporanId if verification succeeds and Link_XLSX is a valid Drive link
209:  *   - throws error if verification fails after all retries
210:  */
211: async function verifyXlsxLinkSaved(
212:   laporanId: string,
213:   cabangId: string,
214:   maxRetries: number = 5,
215:   intervalMs: number = 2000
216: ): Promise<string> {
217:   for (let attempt = 1; attempt <= maxRetries; attempt++) {
218:     try {
219:       // Use /api/laporan/{laporanId}/wa-link endpoint which is available
220:       const res = await fetch(`/api/laporan/${laporanId}/wa-link?cabang=${cabangId}`, { credentials: 'include' });
221:       // Ensure we received JSON; otherwise treat as not ready
222:       let json: any = null;
223:       try {
224:         const contentType = res.headers.get('content-type') || '';
225:         if (!res.ok || !contentType.includes('application/json')) {
226:           throw new Error('Non‑JSON or error response');
227:         }
228:         json = await res.json();
229:       } catch {
230:         json = null;
231:       }
232: 
233:       if (json && json.success && json.data?.laporan?.Link_XLSX) {
234:         const link = json.data.laporan.Link_XLSX;
235:         // Accept Drive link OR in-app web view link
236:         if (
237:           link.includes('drive.google.com') ||
238:           link.includes('drivesdk') ||
239:           link.includes('/laporan/view/')
240:         ) {
241:           return laporanId;
242:         }
243:       }
244: 
245:       if (attempt < maxRetries) {
246:         await new Promise(r => setTimeout(r, intervalMs));
247:       }
248:     } catch {
249:       if (attempt < maxRetries) {

(Showing lines 130-249 of 1736. Use offset=250 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/app/so/input/page.tsx",
  "offset": 560,
  "limit": 170
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/app/so/input/page.tsx</path>
<type>file</type>
<content>
560: 
561:   const [lastEditedItemId, setLastEditedItemId] = useState<string | null>(null);
562:   const [isAtBottom, setIsAtBottom] = useState<boolean>(false);
563: 
564:   // Filter & Search State
565:   const [searchQuery, setSearchQuery] = useState<string>('');
566:   const [selectedArea, setSelectedArea] = useState<string>('Semua');
567: 
568:   // Summary modal state
569:   const [showSummary, setShowSummary] = useState<boolean>(false);
570:   const [pendingPayload, setPendingPayload] = useState<SOFormState | null>(null);
571: 
572:   // Draft (save sementara) state
573:   const [pendingDraft, setPendingDraft] = useState<SODraft | null>(null);
574:   const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);
575:   const draftTimer = useRef<number | null>(null);
576: 
577:   // Petugas = logged-in user name
578:   const petugas = user?.nama || 'Tidak diketahui';
579: 
580:   // Shift yang terakhir dipakai (sessionStorage, bukan localStorage — reset saat tab/navigasi baru)
581:   const [lastShift, setLastShift] = useState<string>(() => {
582:     try {
583:       return sessionStorage.getItem('stokis_so_last_shift') || 'Opening';
584:     } catch {
585:       return 'Opening';
586:     }
587:   });
588: 
589:   const handleRestoreDraft = (draft: SODraft) => {
590:     if (draft.sesiId) sesiIdRef.current = draft.sesiId;
591:     if (draft.tanggalOperasional) setTanggalOperasional(draft.tanggalOperasional);
592:     if (draft.shift) setShift(draft.shift);
593:     if (draft.note) setNote(draft.note);
594:     setCounts((prev) => {
595:       const merged = { ...prev };
596:       Object.keys(draft.counts).forEach((k) => {
597:         const dc = draft.counts[k];
598:         if (
599:           dc &&
600:           (String(dc.step1).trim() !== '' ||
601:             String(dc.step2).trim() !== '' ||
602:             String(dc.keterangan).trim() !== '' ||
603:             dc.statusIsi !== undefined ||
604:             String(dc.tglRefill ?? '').trim() !== '' ||
605:             String(dc.tglPakai ?? '').trim() !== '')
606:         ) {
607:           merged[k] = { ...dc };
608:         }
609:       });
610:       return merged;
611:     });
612:     setPendingDraft(null);
613:   };
614: 
615:   useEffect(() => {
616:     if (!selectedCabang) {
617:       setLoadingData(false);
618:       return;
619:     }
620: 
621:     const fetchData = async () => {
622:       try {
623:         setLoadingData(true);
624:         setErrorMsg('');
625: 
626:         const [resItems, resPrevious] = await Promise.all([
627:           fetch(`/api/master-item?cabang=${selectedCabang.Cabang_ID}`),
628:           // FIX: kirim cabangId agar GAS bisa resolve spreadsheet yang benar
629:           fetch(`/api/so/previous?cabang=${selectedCabang.Cabang_ID}`),
630:         ]);
631: 
632:         const dataItems = await resItems.json();
633:         const dataPrevious = await resPrevious.json();
634: 
635:         if (dataItems.success && Array.isArray(dataItems.data)) {
636:           setItems(dataItems.data);
637:            const initialCounts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }> = {};
638:           dataItems.data.forEach((item: MasterItem) => {
639:             initialCounts[item.Item_ID] = { step1: '', step2: '', keterangan: '', statusIsi: undefined, tglRefill: '', tglPakai: '' };
640:           });
641:           setCounts(initialCounts);
642: 
643:           const cached = loadDraft(selectedCabang.Cabang_ID);
644:           if (cached && countFilled(cached.counts) > 0) {
645:             // Auto-restore draft instead of showing banner
646:             handleRestoreDraft(cached);
647:           }
648:         }
649: 
650:         if (dataPrevious.success && dataPrevious.data) {
651:           const history = Array.isArray(dataPrevious.data.history)
652:             ? dataPrevious.data.history
653:             : [];
654:           setPreviousSOHistory(history);
655: 
656:           // Default to the most recent session
657:           setSelectedPrevIndex(0);
658:           setPreviousSO(
659:             history[0]?.items ||
660:               dataPrevious.data.items ||
661:               {}
662:           );
663:           if (history[0] || dataPrevious.data.latest) {
664:             const ref = history[0]?.tanggal
665:               ? history[0]
666:               : dataPrevious.data.latest;
667:             setPreviousSOInfo({
668:               tanggal: ref.tanggal,
669:               shift: ref.shift,
670:               petugas: ref.petugas || '',
671:               waktu: ref.waktu || '',
672:             });
673:           }
674:         }
675:       } catch (err) {
676:         setErrorMsg('Gagal memuat data: ' + (err instanceof Error ? err.message : String(err)));
677:       } finally {
678:         setLoadingData(false);
679:       }
680:     };
681: 
682:     fetchData();
683:   }, [selectedCabang]);
684: 
685:   // Autosave draft (save sementara) ke localStorage, di-debounce
686:   const cabangId = selectedCabang?.Cabang_ID || null;
687:   useEffect(() => {
688:     if (!cabangId) return;
689:     // Jangan sentuh draft sebelum items dimuat atau sambil menunggu keputusan restore
690:     if (items.length === 0 || pendingDraft) return;
691: 
692:     if (draftTimer.current) window.clearTimeout(draftTimer.current);
693:     draftTimer.current = window.setTimeout(() => {
694:       if (countFilled(counts) > 0) {
695:         saveDraft(cabangId, {
696:           counts,
697:           sesiId: sesiIdRef.current,
698:           tanggalOperasional,
699:           shift,
700:           note,
701:           updatedAt: Date.now(),
702:         });
703:       } else {
704:         clearDraft(cabangId);
705:       }
706:     }, 400);
707:   }, [counts, tanggalOperasional, shift, note, cabangId, items.length, pendingDraft]);
708: 
709:   // Bersihkan timer saat unmount
710:   useEffect(() => {
711:     return () => {
712:       if (draftTimer.current) window.clearTimeout(draftTimer.current);
713:     };
714:   }, []);
715: 
716:   // Peringatkan user jika menutup/me-refresh halaman saat ada data yang belum disubmit
717:   const hasDirtyData = useMemo(() => {
718:     if (submitting) return false;
719:     return countFilled(counts) > 0 || note.trim() !== '';
720:   }, [counts, note, submitting]);
721: 
722:   const filledCount = useMemo(() => countFilled(counts), [counts]);
723:   const fillPercent = items.length > 0 ? Math.round((filledCount / items.length) * 100) : 0;
724: 
725:   useEffect(() => {
726:     if (!hasDirtyData) return;
727:     const handler = (e: BeforeUnloadEvent) => {
728:       e.preventDefault();
729:       e.returnValue = '';

(Showing lines 560-729 of 1736. Use offset=730 to continue.)
</content>
```

---

## Assistant (Plan · Big Pickle · 2.3s)

_Thinking:_

Now let me look at where the draft is cleared after submit, and the welcome page, and ShiftCabangGate's getDraftShift. Let me read around line 1057 and the welcome page.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/app/so/input/page.tsx",
  "limit": 80,
  "offset": 1040
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/app/so/input/page.tsx</path>
<type>file</type>
<content>
1040:       }
1041: 
1042:       // Verify Link_XLSX was saved before redirecting
1043:       setGenStep('verifikasi');
1044:       try {
1045:         const verifiedLaporanId = await verifyXlsxLinkSaved(
1046:           laporanId || formState.sesiId,
1047:           selectedCabang.Cabang_ID
1048:         );
1049:         setGenStep('selesai');
1050:         router.push(`/so/konfirmasi/${verifiedLaporanId}`);
1051:       } catch {
1052:         // Verification failed, but still redirect - UI will show error badge
1053:         setGenStep('selesai');
1054:         router.push(`/so/konfirmasi/${laporanId || formState.sesiId}`);
1055:       }
1056: 
1057:       // Submit sukses → hapus draft sementara
1058:       if (selectedCabang) {
1059:         clearDraft(selectedCabang.Cabang_ID);
1060:         setPendingDraft(null);
1061:       }
1062:     } catch (err) {
1063:       toast.error(
1064:         'Kendala Jaringan',
1065:         'Terjadi kendala jaringan setelah beberapa percobaan: ' +
1066:           (err instanceof Error ? err.message : String(err)),
1067:       );
1068:     } finally {
1069:       setSubmitting(false);
1070:       submittingRef.current = false;
1071:     }
1072:   };
1073: 
1074:   const activeFilterCount = (selectedArea !== 'Semua' ? 1 : 0) + (searchQuery ? 1 : 0);
1075: 
1076:   const scrollTo = (selector: string) => {
1077:     const container = itemsSectionRef.current;
1078:     if (!container) return;
1079:     const el = container.querySelector<HTMLElement>(selector);
1080:     if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
1081:   };
1082: 
1083:   const scrollToFirstItem = () => {
1084:     scrollTo('[data-item-id]');
1085:   };
1086: 
1087:   const scrollToLastEditedItem = () => {
1088:     if (!lastEditedItemId) {
1089:       toast.warning('Belum Ada Item Filled', 'Isi minimal satu kolom terlebih dahulu.');
1090:       return;
1091:     }
1092:     scrollTo(`[data-item-id="${lastEditedItemId}"]`);
1093:   };
1094: 
1095:   const scrollToLastItem = () => {
1096:     const container = itemsSectionRef.current;
1097:     if (!container) return;
1098:     const itemEls = Array.from(container.querySelectorAll<HTMLElement>('[data-item-id]'));
1099:     const last = itemEls[itemEls.length - 1];
1100:     if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
1101:   };
1102: 
1103:   return (
1104:     <>
1105:       <form
1106:         onSubmit={handleSubmit}
1107:         onKeyDown={(e) => {
1108:           // Cegah Enter mengirim form dari input/textarea/select biasa
1109:           // (search, keterangan, dsb). Tombol submit tetap berfungsi normal.
1110:           if (e.key === 'Enter') {
1111:             const tag = (e.target as HTMLElement).tagName;
1112:             if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
1113:               e.preventDefault();
1114:             }
1115:           }
1116:         }}
1117:         className="space-y-6 max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6"
1118:       >
1119:         {/* Draft restore banner - hidden since we now use modal */}

(Showing lines 1040-1119 of 1736. Use offset=1120 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/app/so/input/welcome/page.tsx",
  "limit": 200
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/app/so/input/welcome/page.tsx</path>
<type>file</type>
<content>
1: 'use client';
2: 
3: import React, { useState, useEffect, useCallback } from 'react';
4: import { useRouter } from 'next/navigation';
5: import { motion, AnimatePresence } from 'framer-motion';
6: import { useCabang } from '@/lib/CabangContext';
7: import { useAuth } from '@/lib/AuthContext';
8: import {
9:   ClipboardCheck,
10:   AlertTriangle,
11:   RotateCcw,
12:   Plus,
13:   HardDrive,
14:   ArrowLeft,
15: } from 'lucide-react';
16: import { ShiftCabangGate } from '@/components/ShiftCabangGate';
17: 
18: const DRAFT_PREFIX = 'stokis_so_draft_';
19: 
20: interface SODraft {
21:   counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>;
22:   sesiId: string;
23:   tanggalOperasional: string;
24:   shift: string;
25:   note: string;
26:   updatedAt: number;
27: }
28: 
29: function getDraftKey(cabangId: string): string {
30:   return DRAFT_PREFIX + cabangId;
31: }
32: 
33: function countFilled(
34:   counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>,
35: ): number {
36:   return Object.keys(counts).reduce((n, k) => {
37:     const v = counts[k];
38:     const hasCount =
39:       String(v?.step1 ?? '').trim() !== '' || String(v?.step2 ?? '').trim() !== '' ||
40:       v?.statusIsi !== undefined || String(v?.tglRefill ?? '').trim() !== '' || String(v?.tglPakai ?? '').trim() !== '';
41:     return n + (hasCount ? 1 : 0);
42:   }, 0);
43: }
44: 
45: function loadDraft(cabangId: string): SODraft | null {
46:   try {
47:     const raw = localStorage.getItem(getDraftKey(cabangId));
48:     if (!raw) return null;
49:     const parsed = JSON.parse(raw) as SODraft;
50:     if (!parsed || typeof parsed !== 'object' || !parsed.counts) return null;
51:     return parsed;
52:   } catch {
53:     return null;
54:   }
55: }
56: 
57: function clearDraft(cabangId: string): void {
58:   try {
59:     localStorage.removeItem(getDraftKey(cabangId));
60:   } catch {
61:     // abai
62:   }
63: }
64: 
65: export default function WelcomeSOPage() {
66:   const router = useRouter();
67:   const { selectedCabang, setSelectedCabang, cabangList, loading: cabangLoading } = useCabang();
68:   const { user } = useAuth();
69:   const [pendingDraft, setPendingDraft] = useState<SODraft | null>(null);
70:   const [isLoading, setIsLoading] = useState(true);
71:   const [showShiftGate, setShowShiftGate] = useState(false);
72: 
73:   useEffect(() => {
74:     if (cabangLoading || !user) return;
75: 
76:     const draftCabangId = selectedCabang?.Cabang_ID || user.cabangId;
77:     if (draftCabangId) {
78:       const cached = loadDraft(draftCabangId);
79:       if (cached && countFilled(cached.counts) > 0) {
80:         setPendingDraft(cached);
81:       }
82:     }
83:     setIsLoading(false);
84:   }, [cabangLoading, user, selectedCabang]);
85: 
86:   const handleLanjutkan = () => {
87:     // Draft is already in localStorage, just navigate to input page
88:     // The input page will automatically load the draft
89:     router.push('/so/input');
90:   };
91: 
92:   const handleMulaiBaru = () => {
93:     // Clear draft and show ShiftCabangGate first
94:     if (selectedCabang?.Cabang_ID) {
95:       clearDraft(selectedCabang.Cabang_ID);
96:     }
97:     setShowShiftGate(true);
98:   };
99: 
100:   const handleGateConfirm = (cabangId: string, shift: string) => {
101:     // Set selected cabang and shift, then navigate to input page
102:     const target = cabangList.find((c) => c.Cabang_ID === cabangId) || null;
103:     if (target) {
104:       setSelectedCabang(target);
105:     }
106:     try {
107:       sessionStorage.setItem('stokis_so_last_shift', shift);
108:     } catch {
109:       // ignore
110:     }
111:     setShowShiftGate(false);
112:     router.push('/so/input');
113:   };
114: 
115:   const handleBatal = () => {
116:     router.back();
117:   };
118: 
119:   // ShiftCabangGate variables
120:   const gateInitialCabangId = selectedCabang?.Cabang_ID ?? null;
121:   const gateInitialShift = (() => {
122:     if (selectedCabang) {
123:       const draft = loadDraft(selectedCabang.Cabang_ID);
124:       if (draft?.shift) return draft.shift;
125:     }
126:     try {
127:       const stored = sessionStorage.getItem('stokis_so_last_shift');
128:       if (stored) return stored;
129:     } catch {
130:       // ignore
131:     }
132:     return 'Opening';
133:   })();
134: 
135:   const getDraftShiftForGate = useCallback((cabangId: string): string | null => {
136:     const draft = loadDraft(cabangId);
137:     return draft?.shift ?? null;
138:   }, []);
139: 
140:   if (isLoading || cabangLoading) {
141:     return (
142:       <div className="min-h-screen bg-base-100 flex items-center justify-center">
143:         <div className="flex flex-col items-center gap-4">
144:           <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
145:           <span className="text-sm text-base-content/60">Memuat...</span>
146:         </div>
147:       </div>
148:     );
149:   }
150: 
151:   return (
152:     <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
153:       <motion.div
154:         initial={{ opacity: 0, scale: 0.95 }}
155:         animate={{ opacity: 1, scale: 1 }}
156:         transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
157:         className="bg-base-100 rounded-xl border border-base-300 shadow-2xl w-full max-w-md"
158:       >
159:         {/* Header */}
160:         <div className="flex items-center justify-between p-5 border-b border-base-300">
161:           <div className="flex items-center gap-3">
162:             {pendingDraft ? (
163:               <div className="p-2 rounded-lg bg-warning/10">
164:                 <AlertTriangle className="w-5 h-5 text-warning" />
165:               </div>
166:             ) : (
167:               <div className="p-2 rounded-lg bg-primary/10">
168:                 <ClipboardCheck className="w-5 h-5 text-primary" />
169:               </div>
170:             )}
171:             <div>
172:               <h1 className="font-semibold text-base-content text-lg">
173:                 {pendingDraft ? 'Sesi Belum Selesai' : 'Stock Opname'}
174:               </h1>
175:               <p className="text-xs text-base-content/60">
176:                 {pendingDraft ? 'Ditemukan data yang belum di-submit' : 'Mulai sesi stock opname baru'}
177:               </p>
178:             </div>
179:           </div>
180:         </div>
181: 
182:         {/* Session Info - only show if draft exists */}
183:         {pendingDraft && (
184:           <div className="p-5 space-y-4">
185:             <div className="grid grid-cols-2 gap-3 text-sm">
186:               <div className="space-y-0.5">
187:                 <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Tanggal</span>
188:                 <p className="font-semibold text-base-content">{pendingDraft.tanggalOperasional || 'Tidak tersedia'}</p>
189:               </div>
190:               <div className="space-y-0.5">
191:                 <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Shift</span>
192:                 <p className="font-semibold text-base-content">{pendingDraft.shift || 'Tidak tersedia'}</p>
193:               </div>
194:               <div className="space-y-0.5">
195:                 <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Progress</span>
196:                 <p className="font-semibold text-base-content">{countFilled(pendingDraft.counts)} item terisi</p>
197:               </div>
198:               {pendingDraft.updatedAt && (
199:                 <div className="space-y-0.5">
200:                   <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Terakhir Diedit</span>

(Showing lines 1-200 of 272. Use offset=201 to continue.)
</content>
```

---

## Assistant (Plan · Big Pickle · 7.2s)

_Thinking:_

I now have a good understanding. Let me check the ShiftCabangGate getDraftShift and the discard confirm in input page to complete. Let me quickly read ShiftCabangGate around lines 20-40 and the discard UI around 1540.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/components/ShiftCabangGate.tsx",
  "limit": 45,
  "offset": 20
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/components/ShiftCabangGate.tsx</path>
<type>file</type>
<content>
20:   open,
21:   cabangList,
22:   initialCabangId,
23:   initialShift,
24:   getDraftShift,
25:   onConfirm,
26: }: ShiftCabangGateProps) {
27:   const [step, setStep] = useState<'cabang' | 'shift'>('cabang');
28:   const [cabangId, setCabangId] = useState<string | null>(initialCabangId);
29:   const [shift, setShift] = useState<string>(initialShift);
30: 
31:   const selectedCabang = cabangList.find((c) => c.Cabang_ID === cabangId) || null;
32:   const draftShift = cabangId ? getDraftShift(cabangId) : null;
33:   const hasDraftMismatch = !!draftShift && shift !== draftShift;
34: 
35:   const nextDisabled = step === 'cabang' ? !selectedCabang : !shift;
36: 
37:   const handleNext = () => {
38:     if (step === 'cabang' && selectedCabang) {
39:       setStep('shift');
40:     }
41:   };
42: 
43:   const handleConfirm = () => {
44:     if (!selectedCabang || !shift) return;
45:     onConfirm(selectedCabang.Cabang_ID, shift);
46:   };
47: 
48:   return (
49:     <AnimatePresence>
50:       {open && (
51:         <motion.div
52:           initial={{ opacity: 0 }}
53:           animate={{ opacity: 1 }}
54:           exit={{ opacity: 0 }}
55:           className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
56:           role="dialog"
57:           aria-modal="true"
58:           aria-labelledby="gate-title"
59:         >
60:           <motion.div
61:             initial={{ opacity: 0, y: 16, scale: 0.97 }}
62:             animate={{ opacity: 1, y: 0, scale: 1 }}
63:             transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
64:             className="w-full max-w-md card bg-base-100 border border-base-300 shadow-2xl p-6 space-y-5"

(Showing lines 20-64 of 230. Use offset=65 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/app/so/input/page.tsx",
  "limit": 70,
  "offset": 730
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/app/so/input/page.tsx</path>
<type>file</type>
<content>
730:     };
731:     window.addEventListener('beforeunload', handler);
732:     return () => window.removeEventListener('beforeunload', handler);
733:   }, [hasDirtyData]);
734: 
735:   // Track if user is at bottom of items section (for submit button visibility)
736:   useEffect(() => {
737:     const container = itemsSectionRef.current;
738:     if (!container) return;
739: 
740:     const checkIfAtBottom = () => {
741:       const rect = container.getBoundingClientRect();
742:       const viewportHeight = window.innerHeight;
743:       // Show submit when items section bottom is within 200px of viewport bottom
744:       const distanceFromBottom = rect.bottom - viewportHeight;
745:       setIsAtBottom(distanceFromBottom < 200);
746:     };
747: 
748:     window.addEventListener('scroll', checkIfAtBottom, { passive: true });
749:     // Check initially
750:     checkIfAtBottom();
751: 
752:     return () => window.removeEventListener('scroll', checkIfAtBottom);
753:   }, [items.length]);
754: 
755:   // Choose which previous SO session to use as reference (dropdown)
756:   const handleSelectPrevious = (index: number) => {
757:     const session = previousSOHistory[index];
758:     if (session) {
759:       setSelectedPrevIndex(index);
760:       setPreviousSO(session.items || {});
761:       setPreviousSOInfo({ tanggal: session.tanggal, shift: session.shift, petugas: session.petugas || '', waktu: session.waktu || '' });
762:     }
763:   };
764: 
765:   // Extract unique areas from items
766:   const areas = useMemo(() => {
767:     const areaSet = new Set(items.map(i => i.Area || 'Area Umum'));
768:     return Array.from(areaSet).sort();
769:   }, [items]);
770: 
771:   // Filter items by area and search
772:   const filteredItems = useMemo(() => {
773:     return items.filter(item => {
774:       const matchesArea = selectedArea === 'Semua' || (item.Area || 'Area Umum') === selectedArea;
775:       const query = searchQuery.toLowerCase();
776:       const matchesSearch = !query ||
777:         item.Nama_Barang.toLowerCase().includes(query) ||
778:         item.Item_ID.toLowerCase().includes(query);
779:       return matchesArea && matchesSearch;
780:     });
781:   }, [items, selectedArea, searchQuery]);
782: 
783:   const globalIndexMap = useMemo(() => {
784:     const map: Record<string, number> = {};
785:     filteredItems.forEach((item, idx) => { map[item.Item_ID] = idx + 1; });
786:     return map;
787:   }, [filteredItems]);
788: 
789:   // Stabil via useCallback agar React.memo pada SOItemRow berfungsi.
790:   const handleCountChange = useCallback((itemId: string, field: SOField, value: string | undefined) => {
791:     const nextValue =
792:       field === 'step1' || field === 'step2'
793:         ? sanitizeDecimalInput(String(value ?? ''))
794:         : value;
795:     setCounts((prev) => ({
796:       ...prev,
797:       [itemId]: {
798:         ...prev[itemId],
799:         [field]: nextValue,

(Showing lines 730-799 of 1736. Use offset=800 to continue.)
</content>
```

---

## Assistant (Plan · Big Pickle · 16.5s)

_Thinking:_

I now have a comprehensive understanding. Let me answer the user's question about how the "save draft" system works in this app. This is a question, not a task requiring a plan. I'm in plan mode though. The user asks "bagaimana sistem save draft data di app ini?" — "how does the save draft system in this app work?"

This is an informational question. I don't need to make a plan necessarily, but I should answer based on what I found. Let me provide a concise explanation in Indonesian.

Key facts:
1. Draft saved in `localStorage` browser, per cabang. Key: `stokis_so_draft_{cabangId}`.
2. `SODraft` interface: counts (step1, step2, keterangan, statusIsi, tglRefill, tglPakai), sesiId, tanggalOperasional, shift, note, updatedAt.
3. Autosave debounced 400ms on `counts`, `tanggalOperasional`, `shift`, `note` changes in app/so/input/page.tsx:687.
4. saveDraft writes JSON; clearDraft removes; loadDraft reads.
5. On load, auto-restores draft (page.tsx:643-647 handleRestoreDraft).
6. Welcome page (app/so/input/welcome/page.tsx) shows pending session modal with "Lanjutkan" / "Mulai Baru" (clear) buttons.
7. ShiftCabangGate warns if draft shift mismatch with selected shift.
8. After successful submit, clearDraft (page.tsx:1057-1061).
9. beforeunload warning if dirty data (page.tsx:725).
10. Draft is client-side only — not server synced.

Let me answer concisely.

Sistem draft di app ini **berbasis browser `localStorage`**, khusus untuk form input SO (Stock Opname). Ringkasan alurnya:

**Penyimpanan (autosave)**
- Key: `stokis_so_draft_{cabangId}` → draft disimpan **per cabang** (`app/so/input/page.tsx:145-201`).
- Isi `SODraft`: `counts` (step1/step2/keterangan/statusIsi/tglRefill/tglPakai per item), `sesiId`, `tanggalOperasional`, `shift`, `note`, `updatedAt`.
- Setiap perubahan `counts`, tanggal, shift, atau note di-debounce **400ms** lalu ditulis ke localStorage (`page.tsx:686-707`). Jika tidak ada isian, draft dihapus.
- `beforeunload` memberi peringatan saat keluar/refresh jika ada data belum submit (`page.tsx:725-733`).

**Pemulihan (restore)**
- Halaman `/so/input/welcome` mendeteksi draft tersimpan dan menampilkan modal "Sesi Belum Selesai" → tombol **Lanjutkan Draft** / **Buang & Mulai Baru** (`welcome/page.tsx:73-98`).
- `/so/input` otomatis auto-restore draft saat items dimuat via `handleRestoreDraft` (`page.tsx:589-647`).
- `ShiftCabangGate` memperingatkan bila shift draft tidak cocok dengan shift yang dipilih (`components/ShiftCabangGate.tsx:32-33`).

**Penghapusan**
- Setelah submit sukses → `clearDraft` (`page.tsx:1057-1061`); saat "Mulai Baru" juga dihapus.

Catatan penting: draft **hanya di browser per perangkat** — tidak disinkronkan ke server/Sheets. Data hilang jika localStorage dibersihkan atau pindah perangkat.

---

## User

jadi masih di browser perangkat ya, bis gak aku migrasi ke database langsung?

---

## Assistant (Plan · Big Pickle · 6.9s)

_Thinking:_

The user asks: "jadi masih di browser perangkat ya, bisa gak aku migrasi ke database langsung?" — "so it's still in the device browser, can I migrate it to the database directly?"

They want to migrate the draft system from localStorage to a server-side database. The app uses Google Sheets API as database/storage. Let me investigate the architecture to understand what's involved.

Key points:
- Database = Google Sheets via API. Business logic in `lib/domain/*`, dispatcher `lib/appsscript.ts`, API routes in `app/api/**/route.ts`.
- Draft currently in localStorage.
- To migrate to "database", they'd want to save draft server-side (Sheets), and load per user/cabang.

Let me explore the architecture a bit to construct a proper plan. Let me look at the domain services, dispatcher, and how API routes work, particularly for SO.

Let me look at:
- lib/domain/ structure
- lib/appsscript.ts dispatcher
- existing SO API routes
- how session/user is handled (withAuth)
- Google clients / registry adapters

Let me explore in parallel.





**Tool: bash**

**Input:**
```json
{
  "command": "ls -R lib app/api/so 2>/dev/null | head -100"
}
```

**Output:**
```
app/api/so:
[laporanId]
previous
route.ts

app/api/so/[laporanId]:
pdf
pdf-file
save-laporan
xlsx
xlsx-file

app/api/so/[laporanId]/pdf:

app/api/so/[laporanId]/pdf-file:

app/api/so/[laporanId]/save-laporan:
route.ts

app/api/so/[laporanId]/xlsx:
route.ts

app/api/so/[laporanId]/xlsx-file:
route.ts

app/api/so/previous:
route.ts

lib:
appsscript.ts
AuthContext.tsx
auth.ts
CabangContext.tsx
chart-theme.ts
DocsTOCContext.tsx
domain
env.ts
google
LanguageContext.tsx
session.ts
ToastContext.tsx
TourContext.tsx
tour.ts
utils.ts

lib/domain:
cabang-service.ts
dashboard-service.ts
errors.ts
ids.ts
kategori-service.ts
laporan-service.ts
laporan-view.ts
master-item-service.ts
petugas-service.ts
report-item-type.ts
so-service.ts
so.ts
so-validation.ts
users-service.ts
xlsx-report.ts

lib/google:
client.ts
drive.ts
registry.ts
sheets.ts
template-xlsx.ts

```

**Tool: glob**

**Input:**
```json
{
  "pattern": "lib/domain/**/*.ts"
}
```

**Output:**
```
/home/bradley/project/stokis-project/lib/domain/ids.ts
/home/bradley/project/stokis-project/lib/domain/so-service.ts
/home/bradley/project/stokis-project/lib/domain/so-validation.ts
/home/bradley/project/stokis-project/lib/domain/laporan-service.ts
/home/bradley/project/stokis-project/lib/domain/so.ts
/home/bradley/project/stokis-project/lib/domain/cabang-service.ts
/home/bradley/project/stokis-project/lib/domain/xlsx-report.ts
/home/bradley/project/stokis-project/lib/domain/petugas-service.ts
/home/bradley/project/stokis-project/lib/domain/dashboard-service.ts
/home/bradley/project/stokis-project/lib/domain/laporan-view.ts
/home/bradley/project/stokis-project/lib/domain/errors.ts
/home/bradley/project/stokis-project/lib/domain/master-item-service.ts
/home/bradley/project/stokis-project/lib/domain/users-service.ts
/home/bradley/project/stokis-project/lib/domain/kategori-service.ts
/home/bradley/project/stokis-project/lib/domain/report-item-type.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "app/api/**/route.ts"
}
```

**Output:**
```
/home/bradley/project/stokis-project/app/api/so/route.ts
/home/bradley/project/stokis-project/app/api/so/[laporanId]/xlsx-file/route.ts
/home/bradley/project/stokis-project/app/api/so/[laporanId]/save-laporan/route.ts
/home/bradley/project/stokis-project/app/api/so/[laporanId]/xlsx/route.ts
/home/bradley/project/stokis-project/app/api/so/previous/route.ts
/home/bradley/project/stokis-project/app/api/users/route.ts
/home/bradley/project/stokis-project/app/api/master-item/kategori/[kategoriId]/route.ts
/home/bradley/project/stokis-project/app/api/master-item/kategori/route.ts
/home/bradley/project/stokis-project/app/api/users/[userId]/route.ts
/home/bradley/project/stokis-project/app/api/debug/route.ts
/home/bradley/project/stokis-project/app/api/master-item/batch/route.ts
/home/bradley/project/stokis-project/app/api/master-item/route.ts
/home/bradley/project/stokis-project/app/api/debug/test-drive/route.ts
/home/bradley/project/stokis-project/app/api/debug/ping/route.ts
/home/bradley/project/stokis-project/app/api/dashboard/mingguan/route.ts
/home/bradley/project/stokis-project/app/api/dashboard/dates/[cabang]/route.ts
/home/bradley/project/stokis-project/app/api/dashboard/harian/route.ts
/home/bradley/project/stokis-project/app/api/auth/me/route.ts
/home/bradley/project/stokis-project/app/api/auth/logout/route.ts
/home/bradley/project/stokis-project/app/api/master-item/[itemId]/keterangan/route.ts
/home/bradley/project/stokis-project/app/api/laporan/route.ts
/home/bradley/project/stokis-project/app/api/master-item/[itemId]/status/route.ts
/home/bradley/project/stokis-project/app/api/auth/login/route.ts
/home/bradley/project/stokis-project/app/api/cabang/[cabangId]/route.ts
/home/bradley/project/stokis-project/app/api/master-item/[itemId]/threshold/route.ts
/home/bradley/project/stokis-project/app/api/cabang/route.ts
/home/bradley/project/stokis-project/app/api/petugas/[petugasId]/route.ts
/home/bradley/project/stokis-project/app/api/cabang/[cabangId]/settings/route.ts
/home/bradley/project/stokis-project/app/api/cabang/[cabangId]/status/route.ts
/home/bradley/project/stokis-project/app/api/laporan/[laporanId]/view/route.ts
/home/bradley/project/stokis-project/app/api/master-item/[itemId]/tipe-input/route.ts
/home/bradley/project/stokis-project/app/api/petugas/route.ts
/home/bradley/project/stokis-project/app/api/laporan/[laporanId]/route.ts
/home/bradley/project/stokis-project/app/api/laporan/[laporanId]/edit/route.ts
/home/bradley/project/stokis-project/app/api/petugas/[petugasId]/status/route.ts
/home/bradley/project/stokis-project/app/api/laporan/[laporanId]/status-wa/route.ts
/home/bradley/project/stokis-project/app/api/laporan/[laporanId]/detail/route.ts
/home/bradley/project/stokis-project/app/api/laporan/[laporanId]/regenerate/route.ts
/home/bradley/project/stokis-project/app/api/laporan/[laporanId]/wa-link/route.ts
```

---

## Assistant (Plan · Big Pickle · 3.6s)

_Thinking:_

The user wants to migrate the draft system from browser localStorage to a server-side database (which here is Google Sheets via the SA-based Sheets API). Let me understand the architecture more: how dispatcher and domain services work, and how auth/session gives user identity, and how so-service / so.ts works. Let me explore key files.

Let me read:
- lib/appsscript.ts
- lib/domain/so-service.ts (and so.ts, ids.ts)
- app/api/so/route.ts and previous/route.ts (as patterns)
- lib/auth.ts / session.ts (to understand user identity for draft)
- lib/google/registry.ts and sheets.ts (to understand how sheets are accessed)

That's a lot. Let me use explore agent to gather, or read directly a few key files. Let me read directly.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/lib/appsscript.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/lib/appsscript.ts</path>
<type>file</type>
<content>
1: // lib/appsscript.ts
2: // DISPATCHER LOKAL — pengganti panggilan Google Apps Script.
3: //
4: // Sebelumnya modul ini melakukan fetch ke endpoint GAS. Kini seluruh logika
5: // bisnis dijalankan langsung sebagai TypeScript di server Vercel memakai
6: // Google Sheets API + Google Drive API (Service Account). Dengan begini:
7: //   - Tidak ada deployment GAS / consent / 404 / clasp.
8: //   - Semua route yang memanggil callAppsScript tetap bekerja tanpa perubahan.
9: //
10: // Kontrak dipelihara identik dengan GAS: { success, data?, error? }.
11: // Untuk upload file ke Drive, kita panggil GAS asli karena service account
12: // tidak punya storage quota.
13: 
14: import {
15:   getCabangList as cabangList,
16:   createCabang as createCabangSvc,
17:   updateCabang as updateCabangSvc,
18:   setCabangActive as setCabangActiveSvc,
19: } from '@/lib/domain/cabang-service';
20: import {
21:   getMasterItems,
22:   addItem,
23:   updateThreshold,
24:   setItemActive,
25:   updateTipeInput,
26:   updateKeterangan,
27:   batchUpdate,
28: } from '@/lib/domain/master-item-service';
29: import {
30:   getPetugasList,
31:   addPetugas,
32:   updatePetugas,
33:   setPetugasActive,
34: } from '@/lib/domain/petugas-service';
35: import {
36:   login as loginSvc,
37:   getUsers,
38:   addUser,
39:   updateUser,
40:   setUserActive,
41:   deleteUser,
42: } from '@/lib/domain/users-service';
43: import {
44:   submitSO,
45:   getPreviousSO,
46: } from '@/lib/domain/so-service';
47: import {
48:   saveLaporan as saveLaporanSvc,
49:   searchLaporan,
50:   getShareWhatsAppLink,
51:   updateStatusKirimWA,
52: } from '@/lib/domain/laporan-service';
53: import {
54:   getDashboardHarian,
55:   getDashboardMingguan,
56: } from '@/lib/domain/dashboard-service';
57: import { toApiError, isApiError } from '@/lib/domain/errors';
58: 
59: // eslint-disable-next-line @typescript-eslint/no-explicit-any
60: export interface ApiResponse<T = any> {
61:   success: boolean;
62:   data?: T;
63:   error?: {
64:     code: string;
65:     message: string;
66:   };
67: }
68: 
69: function ok<T>(data: T): ApiResponse<T> {
70:   return { success: true, data };
71: }
72: 
73: function fail(err: unknown): ApiResponse<never> {
74:   const apiErr = isApiError(err) ? err : toApiError(err);
75:   return { success: false, error: { code: apiErr.code, message: apiErr.message } };
76: }
77: 
78: // eslint-disable-next-line @typescript-eslint/no-explicit-any
79: export async function callAppsScript<T = any>(
80:   action: string,
81:   cabangId?: string,
82:   payload?: Record<string, unknown>
83: ): Promise<ApiResponse<T>> {
84:   const p = payload || {};
85:   try {
86:     switch (action) {
87:       // Cabang
88:       case 'getCabangList':        return ok<T>(await cabangList() as T);
89:       case 'createCabang':         return ok<T>(await createCabangSvc(p as never) as T);
90:       case 'updateCabang':         return ok<T>(await updateCabangSvc(cabangId!, p as never) as T);
91:       case 'setCabangActive':      return ok<T>(await setCabangActiveSvc(cabangId!, p.aktif) as T);
92:       // Master Item
93:       case 'getMasterItems':       return ok<T>(await getMasterItems(cabangId!) as T);
94:       case 'addItem':              return ok<T>(await addItem(cabangId!, p as never) as T);
95:       case 'updateThreshold':      return ok<T>(await updateThreshold(cabangId!, String(p.itemId), p.threshold) as T);
96:       case 'setItemActive':        return ok<T>(await setItemActive(cabangId!, String(p.itemId), p.aktif) as T);
97:       case 'updateTipeInput':      return ok<T>(await updateTipeInput(cabangId!, String(p.itemId), p.tipeInput) as T);
98:       case 'updateKeterangan':     return ok<T>(await updateKeterangan(cabangId!, String(p.itemId), p.keterangan) as T);
99:       case 'batchUpdate':          return ok<T>(await batchUpdate(cabangId!, p.updates as Parameters<typeof batchUpdate>[1]) as T);
100:       // Petugas
101:       case 'getPetugasList':       return ok<T>(await getPetugasList(cabangId!) as T);
102:       case 'addPetugas':           return ok<T>(await addPetugas(cabangId!, p as never) as T);
103:       case 'updatePetugas':        return ok<T>(await updatePetugas(cabangId!, String(p.petugasId), p as never) as T);
104:       case 'setPetugasActive':     return ok<T>(await setPetugasActive(cabangId!, String(p.petugasId), p.aktif) as T);
105:       // Users (autentikasi)
106:       case 'login':                return ok<T>(await loginSvc(p as never) as T);
107:       case 'getUsers':             return ok<T>(await getUsers(cabangId || '') as T);
108:       case 'addUser':              return ok<T>(await addUser(p as never) as T);
109:       case 'updateUser':           return ok<T>(await updateUser(String(p.userId), p as never) as T);
110:       case 'setUserActive':        return ok<T>(await setUserActive(String(p.userId), p.aktif) as T);
111:       case 'deleteUser':           return ok<T>(await deleteUser(String(p.userId)) as T);
112:       // SO
113:       case 'submitSO':             return ok<T>(await submitSO(cabangId!, p) as T);
114:       case 'getPreviousSO':        return ok<T>(await getPreviousSO(cabangId!) as T);
115:       // Laporan
116:       case 'saveLaporan':          return ok<T>(await saveLaporanSvc(cabangId!, p as never) as T);
117:       case 'searchLaporan':        return ok<T>(await searchLaporan(cabangId!, p as never) as T);
118:       case 'getShareWhatsAppLink': return ok<T>(await getShareWhatsAppLink(cabangId!, String(p.laporanId)) as T);
119:       case 'updateStatusKirimWA':  return ok<T>(await updateStatusKirimWA(cabangId!, String(p.laporanId)) as T);
120:       // Dashboard
121:       case 'getDashboardHarian':   return ok<T>(await getDashboardHarian(cabangId!, String(p.tanggal || '')) as T);
122:       case 'getDashboardMingguan': return ok<T>(await getDashboardMingguan(cabangId!, String(p.dari || ''), String(p.sampai || '')) as T);
123: 
124:       default:
125:         return { success: false, error: { code: 'invalid_action', message: 'Action tidak dikenal: ' + action } };
126:     }
127:   } catch (err) {
128:     return fail(err) as ApiResponse<T>;
129:   }
130: }
131: 
132: /**
133:  * Panggil Google Apps Script yang sudah di-deploy untuk upload file ke Drive.
134:  * Karena service account tidak punya storage quota, upload dilakukan lewat
135:  * GAS yang berjalan di akun Google user dengan akses Drive penuh.
136:  */
137: export async function uploadFileToGASDrive(params: {
138:   folderId: string;
139:   fileName: string;
140:   mimeType: string;
141:   buffer: Buffer;
142: }): Promise<{ fileId: string; webViewLink: string; downloadUrl: string }> {
143:   const gasUrl = process.env.APPS_SCRIPT_URL;
144:   const apiKey = process.env.STOKIS_API_KEY;
145:   if (!gasUrl) throw new Error('APPS_SCRIPT_URL belum dikonfigurasi');
146:   if (!apiKey) throw new Error('STOKIS_API_KEY belum dikonfigurasi');
147: 
148:   const fileBase64 = params.buffer.toString('base64');
149: 
150:   const res = await fetch(gasUrl, {
151:     method: 'POST',
152:     headers: { 'Content-Type': 'text/plain' },
153:     body: JSON.stringify({
154:       action: 'uploadFileToDrive',
155:       cabangId: '',
156:       'x-api-key': apiKey,
157:       payload: {
158:         folderId: params.folderId,
159:         fileName: params.fileName,
160:         mimeType: params.mimeType,
161:         fileBase64,
162:       },
163:     }),
164:   });
165: 
166:   if (!res.ok) {
167:     throw new Error(`GAS HTTP error: ${res.status} ${res.statusText}`);
168:   }
169: 
170:   const json = await res.json() as ApiResponse<{ fileId: string; webViewLink: string; downloadUrl: string }>;
171:   if (!json.success || !json.data) {
172:     throw new Error(json.error?.message || 'GAS upload gagal');
173:   }
174: 
175:   return json.data;
176: }

(End of file - total 176 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/lib/domain/so-service.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/lib/domain/so-service.ts</path>
<type>file</type>
<content>
1: // lib/domain/so-service.ts
2: // Operasi Stock Opname — port dari SO.js. Menggunakan Google Sheets API
3: // via lib/google/sheets.ts alih-alih SpreadsheetApp.
4: 
5: import { resolveCabang } from '@/lib/google/registry';
6: import {
7:   readSheetData,
8:   sheetToObjects,
9:   appendRows,
10: } from '@/lib/google/sheets';
11: import { ApiError } from './errors';
12: import {
13:   randomToken,
14:   buildTransaksiId,
15:   formatDate,
16: } from './ids';
17: import type { SOItem } from './so';
18: 
19: const MAX_HISTORY_SESSIONS = 8;
20: 
21: interface MasterItem {
22:   Item_ID: string;
23:   Nama_Barang: string;
24:   Area: string;
25:   Threshold: number;
26:   Aktif: boolean | string;
27: }
28: 
29: interface PrevItem {
30:   step1: number;
31:   step2: number;
32:   total: number;
33:   tanggal: string;
34:   shift: string;
35:   petugas: string;
36:   keterangan: string;
37:   waktu: string;
38:   statusIsi?: 'Penuh' | 'Dipakai' | 'Habis' | '';
39:   tglRefill?: string;
40:   tglPakai?: string;
41: }
42: 
43: export interface PreviousSOResult {
44:   latest: {
45:     sesiId: string;
46:     tanggal: string;
47:     shift: string;
48:     petugas: string;
49:     waktu: string;
50:   } | null;
51:   items: Record<string, PrevItem>;
52:   history: Array<{
53:     sesiId: string;
54:     tanggal: string;
55:     shift: string;
56:     petugas: string;
57:     waktu: string;
58:     items: Record<string, PrevItem>;
59:   }>;
60: }
61: 
62: async function readAllRows(
63:   spreadsheetId: string,
64:   sheetName: string
65: ): Promise<Record<string, unknown>[]> {
66:   const { headers, rows } = await readSheetData(spreadsheetId, sheetName);
67:   return sheetToObjects(headers, rows);
68: }
69: 
70: function fmtDate(v: unknown): string {
71:   return formatDate(String(v ?? ''));
72: }
73: 
74: /** Format jam HH:mm dari Timestamp (ISO string / serial number). */
75: function fmtTime(v: unknown): string {
76:   const s = String(v ?? '').trim();
77:   const m = s.match(/(\d{2}):(\d{2})/);
78:   if (m) return `${m[1]}:${m[2]}`;
79:   const num = Number(s);
80:   if (Number.isFinite(num) && num > 0 && !/^\d{4}$/.test(s)) {
81:     const mins = Math.round((num - Math.floor(num)) * 1440) % 1440;
82:     return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
83:   }
84:   return '';
85: }
86: 
87: async function findLaporanIdForSesi(spreadsheetId: string, sesiId: string): Promise<string | null> {
88:   try {
89:     const laporanRows = await readAllRows(spreadsheetId, 'Laporan_PDF');
90:     const found = laporanRows.find((r) => String(r['Sesi_ID']) === sesiId);
91:     return found ? String(found['Laporan_ID']) : null;
92:   } catch {
93:     return null;
94:   }
95: }
96: 
97: /**
98:  * Submit satu sesi Stock Opname. Idempoten per Sesi_ID.
99:  * Mengembalikan { status, sesiId, rows_written, laporanId }.
100:  */
101: export async function submitSO(
102:   cabangId: string,
103:   payload: Record<string, unknown>
104: ): Promise<{
105:   status: string;
106:   sesiId: string;
107:   rows_written: number;
108:   laporanId: string | null;
109: }> {
110:   const { spreadsheetId } = await resolveCabang(cabangId);
111: 
112:   // Baca data SO utuh untuk idempotency check + prev (satu pass, lalu batch).
113:   const soRows = await readAllRows(spreadsheetId, 'SO_Transaksi');
114: 
115:   const sesiId = String(payload.sesiId || '');
116:   const existingIds = soRows.filter((r) => String(r['Sesi_ID']) === sesiId);
117:   if (existingIds.length > 0) {
118:     const laporanId = await findLaporanIdForSesi(spreadsheetId, sesiId);
119:     return { status: 'already_processed', sesiId, rows_written: 0, laporanId };
120:   }
121: 
122:   // Master item untuk enrich nama/area/threshold.
123:   const masterRows = (await readAllRows(spreadsheetId, 'Master_Item')) as unknown as MasterItem[];
124:   const masterMap: Record<string, MasterItem> = {};
125:   masterRows.forEach((m) => { masterMap[m.Item_ID] = m; });
126: 
127:   const items = (payload.items as SOItem[]) || [];
128:   for (const it of items) {
129:     if (!masterMap[it.itemId]) {
130:       throw new ApiError('validation_error', 'Item tidak dikenal pada master cabang: ' + it.itemId);
131:     }
132:   }
133: 
134:   // Data SO sebelumnya (pembanding PDF) — diambil terpisah via getPreviousSO.
135: 
136:   const timestamp = new Date();
137:   const tanggal = String(payload.tanggalOperasional || '');
138:   const shift = String(payload.shift || '');
139:   const petugas = String(payload.petugas || '');
140:   const note = typeof payload.note === 'string' ? payload.note.trim() : '';
141: 
142:   const rows: unknown[][] = [];
143:   items.forEach((it, idx) => {
144:     const master = masterMap[it.itemId];
145:     const transaksiId = buildTransaksiId(tanggal, idx + 1, randomToken(4));
146:     const step1 = Number(it.step1) || 0;
147:     const step2 = Number(it.step2) || 0;
148:     const total = Number(it.total) || (step1 + step2);
149:     rows.push([
150:       transaksiId,
151:       timestamp,
152:       tanggal,
153:       shift,
154:       it.itemId,
155:       master.Nama_Barang,
156:       master.Area,
157:       step1,
158:       step2,
159:       total,
160:       petugas,
161:       sesiId,
162:       it.keterangan,
163:       it.statusIsi || '',
164:       it.tglRefill || '',
165:       it.tglPakai || '',
166:       note,
167:     ]);
168:   });
169: 
170:   if (rows.length > 0) {
171:     await appendRows(spreadsheetId, 'SO_Transaksi', rows);
172:   }
173: 
174:   return {
175:     status: 'success',
176:     sesiId,
177:     rows_written: rows.length,
178:     laporanId: null, // diisi oleh saveLaporan secara terpisah
179:   };
180: }
181: 
182: /**
183:  * Ambil SO sebelumnya (N sesi terakhir). Tidak membaca seluruh sheet dua kali
184:  * penuh; membaca semua baris sekali lalu di-grup di memori.
185:  */
186: export async function getPreviousSO(cabangId: string): Promise<PreviousSOResult> {
187:   const { spreadsheetId } = await resolveCabang(cabangId);
188:   const soRows = await readAllRows(spreadsheetId, 'SO_Transaksi');
189: 
190:   const sessions: Record<string, { tsTime: number; minRow: number; maxRow: number }> = {};
191:   soRows.forEach((r, i) => {
192:     const sid = String(r['Sesi_ID'] || '');
193:     if (!sid) return;
194:     const ts = new Date(r['Timestamp'] as number).getTime() || 0;
195:     const rowIdx = i;
196:     if (!sessions[sid]) {
197:       sessions[sid] = { tsTime: ts, minRow: rowIdx, maxRow: rowIdx };
198:     } else {
199:       sessions[sid].tsTime = Math.max(sessions[sid].tsTime, ts);
200:       sessions[sid].minRow = Math.min(sessions[sid].minRow, rowIdx);
201:       sessions[sid].maxRow = Math.max(sessions[sid].maxRow, rowIdx);
202:     }
203:   });
204: 
205:   const sorted = Object.keys(sessions)
206:     .map((sid) => ({ sid, ...sessions[sid] }))
207:     .sort((a, b) => b.tsTime - a.tsTime)
208:     .slice(0, MAX_HISTORY_SESSIONS);
209: 
210:   if (sorted.length === 0) return { latest: null, items: {}, history: [] };
211: 
212:   const recentIds: Record<string, boolean> = {};
213:   sorted.forEach((s) => { recentIds[s.sid] = true; });
214: 
215:   const grouped: Record<string, Array<Record<string, unknown>>> = {};
216:   soRows.forEach((r) => {
217:     const sid = String(r['Sesi_ID'] || '');
218:     if (!recentIds[sid]) return;
219:     if (!grouped[sid]) grouped[sid] = [];
220:     grouped[sid].push(r);
221:   });
222: 
223:   const history = sorted
224:     .filter((s) => grouped[s.sid])
225:     .map((s) => {
226:       const sessionRows = grouped[s.sid];
227:       const firstRow = sessionRows[0];
228:       const items: Record<string, PrevItem> = {};
229:       sessionRows.forEach((r) => {
230:         const step1 = Number(r['Step1']) || 0;
231:         const step2 = Number(r['Step2']) || 0;
232:         const itemObj: PrevItem = {
233:           step1,
234:           step2,
235:           // Total bisa kosong di sheet → fallback hitung dari Step1+Step2.
236:           total: Number(r['Total']) || (step1 + step2),
237:           tanggal: fmtDate(r['Tanggal_Operasional']),
238:           shift: String(r['Shift'] || ''),
239:           petugas: String(r['Petugas'] || ''),
240:           keterangan: String(r['Keterangan'] ?? r['keterangan'] ?? r['KETERANGAN'] ?? '').trim(),
241:           waktu: fmtTime(r['Timestamp']),
242:           statusIsi: (['Penuh', 'Dipakai', 'Habis'].includes(String(r['Status_Isi']))) ? r['Status_Isi'] as 'Penuh' | 'Dipakai' | 'Habis' : '',
243:           tglRefill: fmtDate(r['Tgl_Refill']),
244:           tglPakai: fmtDate(r['Tgl_Pakai']),
245:         };
246:         const name = String(r['Nama_Barang'] || '').trim();
247:         const itemId = String(r['Item_ID'] || '').trim();
248:         if (name) items[name] = itemObj;
249:         if (itemId) items[itemId] = itemObj;
250:       });
251:       return {
252:         sesiId: s.sid,
253:         tanggal: fmtDate(firstRow['Tanggal_Operasional']),
254:         shift: String(firstRow['Shift'] ?? ''),
255:         petugas: String(firstRow['Petugas'] ?? ''),
256:         waktu: fmtTime(firstRow['Timestamp']),
257:         items,
258:       };
259:     });
260: 
261:   const latestEntry = history[0] || null;
262:   return {
263:     latest: latestEntry
264:       ? {
265:           sesiId: latestEntry.sesiId,
266:           tanggal: latestEntry.tanggal,
267:           shift: latestEntry.shift,
268:           petugas: latestEntry.petugas,
269:           waktu: latestEntry.waktu,
270:         }
271:       : null,
272:     items: latestEntry ? latestEntry.items : {},
273:     history,
274:   };
275: }

(End of file - total 275 lines)
</content>
```

---

## Assistant (Plan · Big Pickle · 4.0s)

_Thinking:_

Now I understand the pattern well. The database is Google Sheets. Let me look at how a route wraps auth and how the `withAuth` / `assertCabangAccess` works and the sheets adapter. Also check the registry, and the headers used to pass cabang. Let me read app/api/so/route.ts and app/api/so/previous/route.ts, lib/domain/errors.ts, and lib/google/registry.ts / sheets.ts, lib/auth.ts.

Let me read several files in parallel.





**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/app/api/so/route.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/app/api/so/route.ts</path>
<type>file</type>
<content>
1: // app/api/so/route.ts
2: import { NextRequest, NextResponse } from 'next/server';
3: import { callAppsScript } from '@/lib/appsscript';
4: import { withAuth, assertCabangAccess } from '@/lib/auth';
5: 
6: const SESI_ID_RE = /^SES[_-][A-Za-z0-9_-]{4,64}$/i;
7: 
8: function jsonError(code: string, message: string, status: number) {
9:   return NextResponse.json({ success: false, error: { code, message } }, { status });
10: }
11: 
12: export const POST = withAuth(async (req: NextRequest, _ctx, session) => {
13:   let raw: unknown;
14:   try {
15:     raw = await req.json();
16:   } catch {
17:     return jsonError('PAYLOAD_INVALID', 'Body request bukan JSON valid', 400);
18:   }
19: 
20:   if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
21:     return jsonError('PAYLOAD_INVALID', 'Body request tidak valid', 400);
22:   }
23: 
24:   const body = raw as Record<string, unknown>;
25:   const { cabangId, sesiId, items } = body;
26: 
27:   if (!cabangId || typeof cabangId !== 'string' || !cabangId.trim()) {
28:     return jsonError('CABANG_REQUIRED', 'Parameter cabangId wajib disertakan', 400);
29:   }
30:   if (!sesiId || typeof sesiId !== 'string' || !SESI_ID_RE.test(sesiId.trim())) {
31:     return jsonError('SESI_ID_INVALID', 'sesiId wajib berupa identifier unik sesi', 400);
32:   }
33:   if (!Array.isArray(items) || items.length === 0) {
34:     return jsonError('ITEMS_REQUIRED', 'items wajib berisi minimal 1 item', 400);
35:   }
36: 
37:   const payload = { ...body, sesiId: sesiId.trim() };
38:   const guard = assertCabangAccess(session, cabangId.trim());
39:   if (guard) return guard;
40:   const result = await callAppsScript('submitSO', cabangId.trim(), payload);
41: 
42:   const already = result.success && result.data?.status === 'already_processed';
43:   const status = already ? 200 : result.success ? 201 : 400;
44: 
45:   return NextResponse.json(result, { status });
46: });

(End of file - total 46 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/app/api/so/previous/route.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/app/api/so/previous/route.ts</path>
<type>file</type>
<content>
1: // app/api/so/previous/route.ts
2: import { NextResponse } from 'next/server';
3: import { callAppsScript } from '@/lib/appsscript';
4: import { withAuth, assertCabangAccess } from '@/lib/auth';
5: 
6: export const GET = withAuth(async (request: Request, _ctx, session) => {
7:   try {
8:     const { searchParams } = new URL(request.url);
9:     const cabangId = searchParams.get('cabang');
10: 
11:     if (!cabangId) {
12:       return NextResponse.json(
13:         { success: false, error: { message: 'Parameter cabang wajib disertakan' } },
14:         { status: 400 }
15:       );
16:     }
17: 
18:     const guard = assertCabangAccess(session, cabangId);
19:     if (guard) return guard;
20: 
21:     const result = await callAppsScript('getPreviousSO', cabangId);
22: 
23:     if (result.success) {
24:       // GAS returns { latest: {...}, items: {...}, history: [...] }
25:       return NextResponse.json({
26:         success: true,
27:         data: {
28:           latest: result.data?.latest || null,
29:           items: result.data?.items || {},
30:           history: result.data?.history || [],
31:         },
32:       });
33:     }
34: 
35:     return NextResponse.json(
36:       { success: false, error: result.error },
37:       { status: 400 }
38:     );
39:   } catch (err: unknown) {
40:     const message = err instanceof Error ? err.message : 'Unknown error';
41:     return NextResponse.json(
42:       { success: false, error: { message: 'Gagal mengambil data SO sebelumnya: ' + message } },
43:       { status: 500 }
44:     );
45:   }
46: });

(End of file - total 46 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/lib/google/registry.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/lib/google/registry.ts</path>
<type>file</type>
<content>
1: // lib/google/registry.ts
2: // Resolver akses data — pengganti Registry.js (getRegistry_, resolveCabangSpreadsheet_,
3: // getCabangList, getSettingsGlobal_) di Google Apps Script.
4: //
5: // Spreadsheet Registry (input: { REGISTRY_SPREADSHEET_ID }) memuat sheet:
6: //   - Daftar_Cabang: { Cabang_ID, ... , Spreadsheet_ID, Folder_Drive_ID, Aktif }
7: //   - Settings_Global : { Key, Value }
8: //   - Template_Referensi : { Template_Spreadsheet_ID di baris 2 kolom 1 }
9: //   - Users : { User_ID, Username, PIN, Nama, Role, Cabang_ID, Aktif, Created_At }
10: 
11: import { getSheetsClient } from './client';
12: import { readSheetData, sheetToObjects, getCellValue } from './sheets';
13: 
14: export interface CabangRecord {
15:   Cabang_ID: string;
16:   Nama_Cabang?: string;
17:   Spreadsheet_ID?: string;
18:   Folder_Drive_ID?: string;
19:   Aktif?: boolean | string;
20:   [key: string]: unknown;
21: }
22: 
23: let _registryId: string | null = null;
24: let _cabangCache: Record<string, { spreadsheetId: string; folderId: string; cabang: CabangRecord }> = {};
25: let _cabangListCache: CabangRecord[] | null = null;
26: 
27: function getRegistrySpreadsheetId(): string {
28:   if (_registryId) return _registryId;
29:   const id = process.env.REGISTRY_SPREADSHEET_ID;
30:   if (!id) {
31:     throw new Error('REGISTRY_SPREADSHEET_ID belum dikonfigurasi di env');
32:   }
33:   _registryId = id;
34:   return _registryId;
35: }
36: 
37: export function resetRegistryCache(): void {
38:   _registryId = null;
39:   _cabangCache = {};
40:   _cabangListCache = null;
41: }
42: 
43: /** Daftar cabang aktif dari registry. */
44: export async function getCabangList(): Promise<CabangRecord[]> {
45:   if (_cabangListCache) return _cabangListCache;
46:   const registryId = getRegistrySpreadsheetId();
47:   const { headers, rows } = await readSheetData(registryId, 'Daftar_Cabang');
48:   const list = sheetToObjects(headers, rows) as CabangRecord[];
49:   _cabangListCache = list.filter((r) => {
50:     const v = r['Aktif'];
51:     return v === true || v === 'true' || v === 'TRUE' || v === 'True';
52:   });
53:   return _cabangListCache;
54: }
55: 
56: /**
57:  * Resolve spreadsheet + folder untuk satu cabang. Mirip resolveCabangSpreadsheet_,
58:  * tapi tanpa cache GAS di memori proses (hanya cache sederhana per-branch).
59:  */
60: export async function resolveCabang(cabangId: string): Promise<{
61:   spreadsheetId: string;
62:   folderId: string;
63:   cabang: CabangRecord;
64: }> {
65:   if (_cabangCache[cabangId]) return _cabangCache[cabangId];
66: 
67:   const registryId = getRegistrySpreadsheetId();
68:   const { headers, rows } = await readSheetData(registryId, 'Daftar_Cabang');
69:   const list = sheetToObjects(headers, rows) as CabangRecord[];
70:   const cabang = list.find((r) => r['Cabang_ID'] === cabangId);
71:   if (!cabang) throw new Error('CABANG_TIDAK_DITEMUKAN: ' + cabangId);
72:   const isAktif = (v: unknown) => v === true || v === 'true' || v === 'TRUE' || v === 'True';
73:   if (!isAktif(cabang['Aktif'])) {
74:     throw new Error('CABANG_TIDAK_AKTIF: ' + cabangId);
75:   }
76: 
77:   const spreadsheetId = String(cabang['Spreadsheet_ID'] || '');
78:   const folderId = String(cabang['Folder_Drive_ID'] || '');
79:   if (!spreadsheetId) throw new Error('Spreadsheet_ID kosong untuk cabang ' + cabangId);
80: 
81:   const resolved = { spreadsheetId, folderId, cabang };
82:   _cabangCache[cabangId] = resolved;
83:   return resolved;
84: }
85: 
86: export async function cabangExists(cabangId: string): Promise<boolean> {
87:   const registryId = getRegistrySpreadsheetId();
88:   const { headers, rows } = await readSheetData(registryId, 'Daftar_Cabang');
89:   const list = sheetToObjects(headers, rows) as CabangRecord[];
90:   return list.some((r) => r['Cabang_ID'] === cabangId);
91: }
92: 
93: /** Nilai dari sheet Settings_Global → object { Key: Value }. */
94: export async function getSettingsGlobal(): Promise<Record<string, string>> {
95:   const registryId = getRegistrySpreadsheetId();
96:   const { headers, rows } = await readSheetData(registryId, 'Settings_Global');
97:   const objs = sheetToObjects(headers, rows);
98:   const result: Record<string, string> = {};
99:   objs.forEach((r) => {
100:     result[String(r['Key'])] = String(r['Value'] ?? '');
101:   });
102:   return result;
103: }
104: 
105: /** Ambil Template_Spreadsheet_ID dari sheet Template_Referensi (baris 2, kolom 1). */
106: export async function getTemplateSpreadsheetId(): Promise<string> {
107:   const registryId = getRegistrySpreadsheetId();
108:   const sheets = getSheetsClient();
109:   const res = await sheets.spreadsheets.values.get({ spreadsheetId: registryId, range: 'Template_Referensi!A2' });
110:   const value = res.data.values?.[0]?.[0];
111:   if (!value) throw new Error('Template_Spreadsheet_ID belum diisi di Registry');
112:   return String(value);
113: }
114: 
115: /** Ambil nilai sel mentah dari registry. */
116: export async function getRegistryCellValue(range: string): Promise<unknown> {
117:   return getCellValue(getRegistrySpreadsheetId(), range);
118: }

(End of file - total 118 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/lib/google/sheets.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/lib/google/sheets.ts</path>
<type>file</type>
<content>
1: // lib/google/sheets.ts
2: // Operasi CRUD dasar Google Sheets API v4 — pengganti fungsi helper GAS
3: // seperti sheetToObjects_, appendRow, setValues, getLastRow, getRange.
4: 
5: import { getSheetsClient } from './client';
6: 
7: export interface SheetData {
8:   headers: string[];
9:   rows: unknown[][];
10: }
11: 
12: /**
13:  * Baca seluruh data sebuah sheet TANPA membuang baris kosong. Nomor baris
14:  * fisik (1-based, baris header = 1) dapat dihitung dari index di rows:
15:  * `rowNumber = i + 2`. Dipakai ketika posisi baris harus dipertahankan
16:  * (mis. update sel in-place di sheet yang menampung banyak laporan).
17:  */
18: export async function readSheetDataRaw(
19:   spreadsheetId: string,
20:   range: string
21: ): Promise<SheetData> {
22:   const sheets = getSheetsClient();
23:   const res = await sheets.spreadsheets.values.get({
24:     spreadsheetId,
25:     range,
26:   });
27:   const values = res.data.values || [];
28:   if (values.length === 0) return { headers: [], rows: [] };
29:   const headers = (values[0] || []).map((h) => String(h).trim());
30:   return { headers, rows: values.slice(1) };
31: }
32: 
33: /**
34:  * Baca seluruh data sebuah sheet dan kembalikan sebagai { headers, rows }.
35:  * Baris kosong (tanpa nilai di semua sel) dihilangkan agar konsisten dengan
36:  * sheetToObjects_ yang mengabaikan baris kosong.
37:  */
38: export async function readSheetData(
39:   spreadsheetId: string,
40:   range: string
41: ): Promise<SheetData> {
42:   const sheets = getSheetsClient();
43:   const res = await sheets.spreadsheets.values.get({
44:     spreadsheetId,
45:     range,
46:   });
47:   const values = res.data.values || [];
48:   if (values.length === 0) return { headers: [], rows: [] };
49: 
50:   const headers = (values[0] || []).map((h) => String(h).trim());
51:   const rows = values
52:     .slice(1)
53:     .filter((row) => row.some((cell) => String(cell).trim() !== ''));
54:   return { headers, rows };
55: }
56: 
57: /**
58:  * Konversi { headers, rows } menjadi array objek dengan kunci = header.
59:  * Mirip sheetToObjects_ di GAS.
60:  */
61: export function sheetToObjects(headers: string[], rows: unknown[][]): Record<string, unknown>[] {
62:   return rows.map((row) => {
63:     const obj: Record<string, unknown> = {};
64:     headers.forEach((h, i) => {
65:       obj[h] = row[i];
66:     });
67:     return obj;
68:   });
69: }
70: 
71: /**
72:  * Cari index baris (0-based di dalam rows, di mana row[0] = baris data pertama
73:  * setelah header) berdasarkan nilai pada kolom tertentu. Mengembalikan
74:  * { index, row }. index = -1 bila tidak ditemukan.
75:  */
76: export function findRowIndex(
77:   rows: unknown[][],
78:   columnIndex: number,
79:   value: string
80: ): { index: number; row: unknown[] | null } {
81:   for (let i = 0; i < rows.length; i++) {
82:     if (String(rows[i][columnIndex]) === value) {
83:       return { index: i, row: rows[i] };
84:     }
85:   }
86:   return { index: -1, row: null };
87: }
88: 
89: /** Ambil nilai satu sel. */
90: export async function getCellValue(
91:   spreadsheetId: string,
92:   range: string
93: ): Promise<unknown> {
94:   const sheets = getSheetsClient();
95:   const res = await sheets.spreadsheets.values.get({
96:     spreadsheetId,
97:     range,
98:   });
99:   const values = res.data.values || [];
100:   return values[0]?.[0];
101: }
102: 
103: /**
104:  * Tulis satu baris penuh (1 row, N columns) ke posisi tertentu.
105:  * Index 1-based seperti spreadsheets API.
106:  */
107: export async function writeRow(
108:   spreadsheetId: string,
109:   range: string,
110:   row: unknown[]
111: ): Promise<void> {
112:   const sheets = getSheetsClient();
113:   await sheets.spreadsheets.values.update({
114:     spreadsheetId,
115:     range,
116:     valueInputOption: 'USER_ENTERED',
117:     requestBody: { values: [row] },
118:   });
119: }
120: 
121: /** Set nilai satu sel. */
122: export async function setCellValue(
123:   spreadsheetId: string,
124:   range: string,
125:   value: unknown
126: ): Promise<void> {
127:   await writeRow(spreadsheetId, range, [value]);
128: }
129: 
130: /**
131:  * Hapus 1 baris data pada index (1-based, termasuk header = baris 1).
132:  * Menggunakan deleteDimension untuk menghapus baris secara permanen.
133:  */
134: export async function deleteRow(
135:   spreadsheetId: string,
136:   sheetName: string,
137:   rowNumber1Based: number
138: ): Promise<void> {
139:   const sheets = getSheetsClient();
140:   const meta = await sheets.spreadsheets.get({
141:     spreadsheetId,
142:     fields: 'sheets.properties(sheetId,title)',
143:   });
144:   const target = (meta.data.sheets || []).find(
145:     (s) => s.properties?.title === sheetName
146:   );
147:   if (!target?.properties?.sheetId) {
148:     throw new Error('Sheet tidak ditemukan: ' + sheetName);
149:   }
150:   await sheets.spreadsheets.batchUpdate({
151:     spreadsheetId,
152:     requestBody: {
153:       requests: [
154:         {
155:           deleteDimension: {
156:             range: {
157:               sheetId: target.properties.sheetId,
158:               dimension: 'ROWS',
159:               startIndex: rowNumber1Based - 1,
160:               endIndex: rowNumber1Based,
161:             },
162:           },
163:         },
164:       ],
165:     },
166:   });
167: }
168: 
169: /**
170:  * Append beberapa baris sekaligus ke bagian bawah sheet (batch write).
171:  * Mempertahankan pola `setValues` 1 batch daripada 1 write per baris.
172:  */
173: export async function appendRows(
174:   spreadsheetId: string,
175:   sheetName: string,
176:   rows: unknown[][]
177: ): Promise<void> {
178:   if (rows.length === 0) return;
179:   const sheets = getSheetsClient();
180:   await sheets.spreadsheets.values.append({
181:     spreadsheetId,
182:     range: sheetName,
183:     valueInputOption: 'USER_ENTERED',
184:     insertDataOption: 'INSERT_ROWS',
185:     requestBody: { values: rows },
186:   });
187: }
188: 
189: /**
190:  * Pastikan sebuah sheet dengan judul tertentu ada di spreadsheet.
191:  * Bila belum ada, buat sheet baru lalu tulis baris header.
192:  * Bila sudah ada tapi baris header-nya beda, perbarui header agar konsisten.
193:  */
194: export async function ensureSheet(
195:   spreadsheetId: string,
196:   sheetTitle: string,
197:   headers: string[]
198: ): Promise<void> {
199:   const sheets = getSheetsClient();
200:   const meta = await sheets.spreadsheets.get({
201:     spreadsheetId,
202:     fields: 'sheets.properties.title',
203:   });
204:   const exists = (meta.data.sheets || []).some(
205:     (s) => s.properties?.title === sheetTitle
206:   );
207: 
208:   if (!exists) {
209:     await sheets.spreadsheets.batchUpdate({
210:       spreadsheetId,
211:       requestBody: {
212:         requests: [{ addSheet: { properties: { title: sheetTitle } } }],
213:       },
214:     });
215:     await writeRow(spreadsheetId, `${sheetTitle}!A1`, headers);
216:     return;
217:   }
218: 
219:   const res = await sheets.spreadsheets.values.get({
220:     spreadsheetId,
221:     range: `${sheetTitle}!A1`,
222:   });
223:   const current = (res.data.values?.[0] || []).map((h) => String(h).trim());
224:   const needsUpdate =
225:     current.length !== headers.length ||
226:     current.some((h, i) => h !== headers[i]);
227:   if (needsUpdate) {
228:     await writeRow(spreadsheetId, `${sheetTitle}!A1`, headers);
229:   }
230: }
231: 
232: /** Konversi index kolom 0-based menjadi huruf kolom Sheets (0 -> A, 10 -> K, 26 -> AA, dst). */
233: export function columnIndexToLetter(index: number): string {
234:   let n = index + 1;
235:   let letters = '';
236:   while (n > 0) {
237:     const rem = (n - 1) % 26;
238:     letters = String.fromCharCode(65 + rem) + letters;
239:     n = Math.floor((n - 1) / 26);
240:   }
241:   return letters;
242: }
243: 

(End of file - total 243 lines)
</content>
```

---

## Assistant (Plan · Big Pickle · 6.1s)

_Thinking:_

Now I understand the architecture well. The "database" is Google Sheets (per-cabang spreadsheet). To migrate draft to the database, we'd add a `SO_Draft` sheet to the per-cabang spreadsheet (or the registry spreadsheet) storing draft rows, keyed by user/cabang/shift.

Let me check:
- lib/auth.ts to understand session (userId) — draft keyed by user.
- how existing sheets get created (template). Let me check where ensureSheet is used - probably when creating cabang (cabang-service). Let me look at cabang-service.ts to see how new cabang spreadsheets are seeded with sheets.

Let me also check the data model docs, particularly the spreadsheet schema - SO_Transaksi headers. And check how the template spreadsheet is copied to create a new cabang. Let me search for ensureSheet usage and createCabang.

Also, check auth.ts for assertCabangAccess and session structure.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/lib/auth.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/lib/auth.ts</path>
<type>file</type>
<content>
1: // lib/auth.ts
2: // Server-side auth middleware for API routes
3: // Validates session cookies and enforces role-based access control
4: 
5: import { NextRequest, NextResponse } from 'next/server';
6: import {
7:   getSessionFromRequest,
8:   SessionData,
9: } from '@/lib/session';
10: 
11: type RouteHandler = (
12:   req: NextRequest,
13:   context: any,
14:   session: SessionData
15: ) => Promise<NextResponse>;
16: 
17: /**
18:  * Wrap an API route handler with authentication.
19:  * @param handler - The route handler function
20:  * @param options.requiredRole - If set, only users with this role can access
21:  */
22: export function withAuth(
23:   handler: RouteHandler,
24:   options?: { requiredRole?: string }
25: ) {
26:   return async (req: NextRequest, context: any) => {
27:     const session = getSessionFromRequest(req);
28: 
29:     if (!session) {
30:       return NextResponse.json(
31:         {
32:           success: false,
33:           error: {
34:             code: 'UNAUTHORIZED',
35:             message: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login ulang.',
36:           },
37:         },
38:         { status: 401 }
39:       );
40:     }
41: 
42:     if (options?.requiredRole && session.role !== options.requiredRole) {
43:       return NextResponse.json(
44:         {
45:           success: false,
46:           error: {
47:             code: 'FORBIDDEN',
48:             message: 'Akses ditolak. Hanya user dengan role "' + options.requiredRole + '" yang diizinkan.',
49:           },
50:         },
51:         { status: 403 }
52:       );
53:     }
54: 
55:     return handler(req, context, session);
56:   };
57: }
58: 
59: /**
60:  * Guard: pastikan user boleh mengakses data cabang tertentu.
61:  * Admin boleh akses cabang manapun. Petugas hanya boleh akses cabang sendiri.
62:  * @returns NextResponse error jika ditolak, null jika lolos
63:  */
64: export function assertCabangAccess(
65:   session: SessionData,
66:   cabangId: string
67: ): NextResponse | null {
68:   if (session.role === 'admin') return null;
69:   const reqCabang = (cabangId || '').trim().toUpperCase();
70:   if (!reqCabang) return null;
71:   const allowedCabangs = (session.cabangId || '')
72:     .split(',')
73:     .map((c) => c.trim().toUpperCase())
74:     .filter(Boolean);
75:   if (allowedCabangs.includes(reqCabang)) return null;
76:   return NextResponse.json(
77:     {
78:       success: false,
79:       error: {
80:         code: 'FORBIDDEN',
81:         message: 'Tidak diizinkan mengakses data cabang lain',
82:       },
83:     },
84:     { status: 403 }
85:   );
86: }

(End of file - total 86 lines)
</content>
```

**Tool: grep**

**Input:**
```json
{
  "pattern": "ensureSheet|SO_Transaksi|Laporan_PDF",
  "include": "*.ts"
}
```

**Output:**
```
Found 37 matches
/home/bradley/project/stokis-project/app/api/so/[laporanId]/xlsx-file/route.ts:
  Line 70:   // 1) Header laporan dari Laporan_PDF

  Line 71:   const laporanData = await readSheetData(spreadsheetId, 'Laporan_PDF');


/home/bradley/project/stokis-project/lib/domain/dashboard-service.ts:
  Line 21:   const soRows = (await readAllRows(spreadsheetId, 'SO_Transaksi')).filter(

  Line 57:   const soRows = (await readAllRows(spreadsheetId, 'SO_Transaksi')).filter((r) => {


/home/bradley/project/stokis-project/lib/domain/laporan-service.ts:
  Line 5: import { readSheetData, readSheetDataRaw, sheetToObjects, findRowIndex, appendRows, writeRow, setCellValue, ensureSheet, columnIndexToLetter } from '@/lib/google/sheets';

  Line 68:   const laporanRows = await readAllRows(spreadsheetId, 'Laporan_PDF');

  Line 94:   await appendRows(spreadsheetId, 'Laporan_PDF', [[

  Line 138:  * BUKAN SO_COL (layout SO_Transaksi). Mengembalikan null bila field tak dikenal.

  Line 152:   await ensureSheet(spreadsheetId, LAPORAN_DETAIL_SHEET, LAPORAN_DETAIL_HEADERS);

  Line 168:   await ensureSheet(spreadsheetId, LAPORAN_DETAIL_SHEET, LAPORAN_DETAIL_HEADERS);

  Line 222:   let rows = (await readAllRows(spreadsheetId, 'Laporan_PDF')) as unknown as LaporanRow[];

  Line 234:   const rows = await readAllRows(spreadsheetId, 'Laporan_PDF');

  Line 249:   const { rows } = await readSheetData(spreadsheetId, 'Laporan_PDF');

  Line 253:   await writeRow(spreadsheetId, `Laporan_PDF!J${rowNumber}`, ['Sudah Dikirim']);

  Line 258:  * Simpan link XLSX yang sudah di-upload ke Drive ke baris Laporan_PDF.

  Line 272:   const { headers, rows } = await readSheetData(spreadsheetId, 'Laporan_PDF');

  Line 281:     await setCellValue(spreadsheetId, 'Laporan_PDF!K1', 'Link_XLSX');

  Line 286:   await writeRow(spreadsheetId, `Laporan_PDF!${colLetter}${rowNumber}`, [linkXlsx]);

  Line 291:  * Simpan link XLSX DAN fileId ke baris Laporan_PDF.

  Line 305:   const { headers, rows } = await readSheetData(spreadsheetId, 'Laporan_PDF');

  Line 314:     await setCellValue(spreadsheetId, 'Laporan_PDF!K1', 'Link_XLSX');

  Line 318:   await writeRow(spreadsheetId, `Laporan_PDF!${colLetterK}${rowNumber}`, [linkXlsx]);

  Line 324:     await setCellValue(spreadsheetId, 'Laporan_PDF!L1', 'Link_XLSX_FileId');

  Line 327:   await writeRow(spreadsheetId, `Laporan_PDF!${colLetterL}${rowNumber}`, [fileId]);

  Line 338:  * Ambil data laporan dari Laporan_PDF berdasarkan Laporan_ID.

  Line 345:   const rows = await readAllRows(spreadsheetId, 'Laporan_PDF');

  Line 412:   await ensureSheet(spreadsheetId, 'Laporan_Edit_Log', headers);

  Line 432:  * Fallback data live dari SO_Transaksi untuk laporan lama yang kolom

  Line 442:     const { headers, rows } = await readSheetData(spreadsheetId, 'SO_Transaksi');

  Line 503:   await ensureSheet(spreadsheetId, CABANG_SETTINGS_SHEET, ['Key', 'Value']);


/home/bradley/project/stokis-project/app/api/dashboard/dates/[cabang]/route.ts:
  Line 25:     const soData = await readSheetData(resolved.spreadsheetId, 'SO_Transaksi');


/home/bradley/project/stokis-project/app/api/so/[laporanId]/save-laporan/route.ts:
  Line 2: // Menyimpan catatan laporan ke Laporan_PDF secara langsung dari payload,


/home/bradley/project/stokis-project/lib/domain/so-service.ts:
  Line 89:     const laporanRows = await readAllRows(spreadsheetId, 'Laporan_PDF');

  Line 113:   const soRows = await readAllRows(spreadsheetId, 'SO_Transaksi');

  Line 171:     await appendRows(spreadsheetId, 'SO_Transaksi', rows);

  Line 188:   const soRows = await readAllRows(spreadsheetId, 'SO_Transaksi');


/home/bradley/project/stokis-project/lib/google/sheets.ts:
  Line 194: export async function ensureSheet(

```

---

## Assistant (Plan · Big Pickle · 14.2s)

_Thinking:_

Now I understand the whole architecture. The database is per-cabang Google Spreadsheet with sheets like `SO_Transaksi`, `Laporan_PDF`, `Master_Item`. 

To migrate drafts to the database, we'd add a `SO_Draft` sheet in each cabang spreadsheet. Draft would be saved server-side:
- API routes: `POST /api/so/draft` (save), `GET /api/so/draft?cabang=...` (load), `DELETE /api/so/draft?cabang=...` (clear)
- domain service: `lib/domain/so-draft-service.ts`
- dispatcher actions: `saveSODraft`, `getSODraft`, `clearSODraft`
- sheets: `SO_Draft` with headers like `Cabang_ID`, `User_ID`, `Sesi_ID`, `Tanggal_Operasional`, `Shift`, `Note`, `Item_ID`, `Step1`, `Step2`, `Keterangan`, `Status_Isi`, `Tgl_Refill`, `Tgl_Pakai`, `Updated_At`. Or store the whole counts as JSON per row keyed by user + cabang. Actually storing one JSON blob per user is simpler; but a normalized layout matches the rest of the system (which uses rows). A JSON blob in a single cell is easier to write/read atomically. But Google Sheets limits cell size (50,000 chars). For many items this might be ok. A normalized per-item row layout is safer and consistent.

Given the app already stacks rows per session in SO_Transaksi, the parallel choice is a `SO_Draft` sheet with per-item rows.

Now, the question is whether to put the draft sheet in each cabang's spreadsheet or in the registry spreadsheet. Drafts are per cabang. But the draft belongs to user + cabang. Since each cabang spreadsheet is per cabang, saving there is fine (like SO_Transaksi).

However, there's a key concern: the localStorage implementation keys drafts by cabang only, and doesn't distinguish users. On a shared device, drafts would collide across users. The database migration could key by user + cabang.

Also mobile user flow: currently localStorage allows offline editing. Migrating to server would require network on every autosave; debounce changes. Also high write frequency: every 400ms to Sheets API isn't sustainable. Google Sheets quota limits (300 req/min per project; 60 req/min per user). Autosave every 400ms = 150 writes/min. That would blow through quota. So we'd need to:
- Increase debounce (e.g. 1-2s idle)
- Or save on blur/unmount + periodic (e.g. every 30s) rather than every keystroke.

Also, drafts typically should not pollute production sheets. But the user explicitly asked to migrate to database.

Let me also consider: Is there any real database at all? The CLAUDE.md says Google Sheets is the database/storage. There's no Postgres/MySQL. So "migrasi ke database" means Google Sheets. Good.

Let me check the SO_COL default schema / template headers to match layout. Let me look at the SO_Transaksi headers defined somewhere - maybe in apps-script or a template. Let me search for headers arrays. Also check where new cabang/create cabang seeds sheets. Let me check cabang-service.ts.

Also need to check how ShiftCabangGate / welcome page read draft — these are client-side. The migration will change those to fetch from API. And `beforeunload`.

Let me look at cabang-service to see template copy and ensureSheet seeding. And check lib/domain/so.ts for SOItem shape. And the test folder to understand test conventions.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/lib/domain/cabang-service.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/lib/domain/cabang-service.ts</path>
<type>file</type>
<content>
1: // lib/domain/cabang-service.ts
2: // Operasi cabang — port dari Cabang.js + Registry.js (getCabangList).
3: // Membuat cabang baru menyalin template spreadsheet + membuat folder Drive.
4: 
5: import { getDriveClient } from '@/lib/google/client';
6: import {
7:   getCabangList as listCabangFromRegistry,
8:   getSettingsGlobal,
9:   getTemplateSpreadsheetId,
10: } from '@/lib/google/registry';
11: import { readSheetData, appendRows, findRowIndex, writeRow } from '@/lib/google/sheets';
12: import { ApiError } from './errors';
13: import { randomToken, buildCabangId } from './ids';
14: import { initKategoriSheetForNewCabang } from './kategori-service';
15: 
16: export interface CreateCabangPayload {
17:   Nama_Cabang: string;
18:   Alamat?: string;
19:   PIC_Nama?: string;
20:   Nomor_WA_Cabang?: string;
21: }
22: 
23: export async function getCabangList() {
24:   return listCabangFromRegistry();
25: }
26: 
27: export async function createCabang(payload: CreateCabangPayload): Promise<{
28:   cabangId: string;
29:   spreadsheetId: string;
30:   folderId: string;
31: }> {
32:   const { Nama_Cabang } = payload;
33:   if (!Nama_Cabang) throw new ApiError('validation_error', 'Nama_Cabang wajib diisi');
34: 
35:   const drive = getDriveClient();
36: 
37:   // 1. Template ID dari Registry.
38:   const templateId = await getTemplateSpreadsheetId();
39: 
40:   // 2. Folder induk dari Settings_Global (fallback ke env).
41:   const settings = await getSettingsGlobal();
42:   const parentFolderId =
43:     settings['Folder_Drive_Induk'] || process.env.FOLDER_DRIVE_INDUK || '';
44:   if (!parentFolderId) throw new ApiError('server_error', 'Folder_Drive_Induk belum dikonfigurasi');
45:   await drive.files.get({ fileId: parentFolderId, fields: 'id' });
46: 
47:   // 3. Salin template → spreadsheet baru di folder induk.
48:   const copyRes = await drive.files.copy({
49:     fileId: templateId,
50:     requestBody: {
51:       name: 'SO_' + Nama_Cabang,
52:       parents: [parentFolderId],
53:     },
54:   });
55:   const newSpreadsheetId = String(copyRes.data.id || '');
56: 
57:   // 4. Buat folder Drive untuk laporan cabang.
58:   const folderRes = await drive.files.create({
59:     requestBody: {
60:       name: 'Files_' + Nama_Cabang,
61:       mimeType: 'application/vnd.google-apps.folder',
62:       parents: [parentFolderId],
63:     },
64:     fields: 'id',
65:   });
66:   const pdfFolderId = String(folderRes.data.id || '');
67: 
68:   // 4b. Inisialisasi sheet Kategori_Item (seed default) di spreadsheet cabang baru.
69:   await initKategoriSheetForNewCabang(newSpreadsheetId);
70: 
71:   // 5. Cabang_ID unik.
72:   const cabangId = buildCabangId(randomToken(6));
73: 
74:   // 6. Tulis ke Registry Daftar_Cabang.
75:   const registryId = process.env.REGISTRY_SPREADSHEET_ID!;
76:   await appendRows(registryId, 'Daftar_Cabang', [[
77:     cabangId,
78:     Nama_Cabang,
79:     payload.Alamat || '',
80:     newSpreadsheetId,
81:     pdfFolderId,
82:     payload.PIC_Nama || '',
83:     payload.Nomor_WA_Cabang || '',
84:     true,
85:     new Date(),
86:   ]]);
87: 
88:   return { cabangId, spreadsheetId: newSpreadsheetId, folderId: pdfFolderId };
89: }
90: 
91: export async function updateCabang(
92:   cabangId: string,
93:   payload: CreateCabangPayload
94: ): Promise<{ updated: string }> {
95:   const registryId = process.env.REGISTRY_SPREADSHEET_ID!;
96:   const { rows } = await readSheetData(registryId, 'Daftar_Cabang');
97:   const found = findRowIndex(rows, 0, cabangId);
98:   if (found.index === -1) throw new ApiError('not_found', 'Cabang ' + cabangId + ' tidak ditemukan');
99: 
100:   const updated = (found.row as unknown[]).slice();
101:   if (payload.Nama_Cabang !== undefined) updated[1] = payload.Nama_Cabang;
102:   if (payload.Alamat !== undefined) updated[2] = payload.Alamat;
103:   if (payload.PIC_Nama !== undefined) updated[5] = payload.PIC_Nama;
104:   if (payload.Nomor_WA_Cabang !== undefined) updated[6] = payload.Nomor_WA_Cabang;
105: 
106:   const rowNumber = found.index + 2;
107:   await writeRow(registryId, `Daftar_Cabang!A${rowNumber}`, updated);
108:   return { updated: cabangId };
109: }
110: 
111: export async function setCabangActive(
112:   cabangId: string,
113:   aktif: unknown
114: ): Promise<{ cabangId: string; aktif: boolean }> {
115:   const registryId = process.env.REGISTRY_SPREADSHEET_ID!;
116:   const { rows } = await readSheetData(registryId, 'Daftar_Cabang');
117:   const found = findRowIndex(rows, 0, cabangId);
118:   if (found.index === -1) throw new ApiError('not_found', 'Cabang ' + cabangId + ' tidak ditemukan');
119:   const rowNumber = found.index + 2;
120:   const val = aktif === true || aktif === 'true';
121:   await writeRow(registryId, `Daftar_Cabang!H${rowNumber}`, [val]);
122:   return { cabangId, aktif: val };
123: }

(End of file - total 123 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/lib/domain/so.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/lib/domain/so.ts</path>
<type>file</type>
<content>
1: // lib/domain/so.ts
2: // Konstanta kolom + tipe domain untuk tabel Stock Opname & Laporan.
3: // Port dari SO_COL (Utils.js) dan struktur sheet.
4: 
5: export const SO_COL = {
6:   Transaksi_ID: 1,
7:   Timestamp: 2,
8:   Tanggal_Operasional: 3,
9:   Shift: 4,
10:   Item_ID: 5,
11:   Nama_Barang: 6,
12:   Area: 7,
13:   Step1: 8,
14:   Step2: 9,
15:   Total: 10,
16:   Petugas: 11,
17:   Sesi_ID: 12,
18:   Keterangan: 13,
19:   Status_Isi: 14,
20:   Tgl_Refill: 15,
21:   Tgl_Pakai: 16,
22:   Note: 17,
23:   Tgl_Kedaluwarsa: 18,
24: } as const;
25: 
26: export function calculateStatus(total: number, threshold: number | null | undefined): string {
27:   if (threshold === null || threshold === undefined || isNaN(threshold) || threshold < 0) {
28:     return 'Tidak Dipantau';
29:   }
30:   if (total <= threshold) return 'Kritis';
31:   if (threshold > 0 && total <= threshold * 2) return 'Hampir Habis';
32:   return 'Aman';
33: }
34: 
35: export function parseThreshold(v: unknown): number | null {
36:   if (v === undefined || v === null || String(v).trim() === '') return null;
37:   if (typeof v === 'number') return isNaN(v) ? null : v;
38:   const s = String(v).replace(',', '.').trim();
39:   const n = parseFloat(s);
40:   return isNaN(n) ? null : n;
41: }
42: 
43: /**
44:  * Filter free-form decimal text for controlled inputs.
45:  * Avoids mobile keyboard digit-duplication bugs from controlled <input type="number">.
46:  * Allows digits and a single decimal separator (`.` or `,`, normalized to `.`).
47:  */
48: export function sanitizeDecimalInput(raw: string): string {
49:   const normalized = raw.replace(/,/g, '.');
50:   let out = '';
51:   let seenDot = false;
52:   for (const ch of normalized) {
53:     if (ch >= '0' && ch <= '9') {
54:       out += ch;
55:     } else if (ch === '.' && !seenDot) {
56:       out += '.';
57:       seenDot = true;
58:     }
59:   }
60:   return out;
61: }
62: 
63: export type InputTipe = 'single' | 'dual' | 'boolean' | 'date' | 'text' | 'expiry';
64: 
65: export function parseTipeInput(raw: unknown): InputTipe[] {
66:   const s = String(raw || '').trim().toLowerCase();
67:   if (!s) return ['dual'];
68:   const allowed = new Set<InputTipe>(['single', 'dual', 'boolean', 'date', 'text', 'expiry']);
69:   const parsed = s
70:     .split(',')
71:     .map((t) => t.trim())
72:     .filter((t): t is InputTipe => allowed.has(t as InputTipe));
73:   return parsed.length > 0 ? parsed : ['dual'];
74: }
75: 
76: export function hasTipe(tipeInput: InputTipe[], tipe: InputTipe): boolean {
77:   return tipeInput.includes(tipe);
78: }
79: 
80: export interface SOItem {
81:   itemId: string;
82:   step1: number;
83:   step2: number;
84:   total: number;
85:   keterangan: string;
86:   statusIsi?: 'Penuh' | 'Dipakai' | 'Habis' | '';
87:   tglRefill?: string;
88:   tglPakai?: string;
89:   tglKedaluwarsa?: string;
90: }
91: 
92: export interface ValidatedSOPayload {
93:   sesiId: string;
94:   tanggalOperasional: string;
95:   shift: string;
96:   petugas: string;
97:   items: SOItem[];
98:   note?: string;
99: }
100: 
101: export function isNonNegativeNumber(v: unknown): boolean {
102:   if (typeof v === 'number') return isFinite(v) && v >= 0;
103:   if (typeof v === 'string' && v.trim() !== '') {
104:     const n = Number(v);
105:     return isFinite(n) && n >= 0;
106:   }
107:   return false;
108: }
109: 
110: export function normalizeCount(v: unknown): number {
111:   if (v === undefined || v === null || v === '') return 0;
112:   const n = Number(v);
113:   return isFinite(n) && n >= 0 ? n : 0;
114: }
115: 
116: /** Tanggal hari ini dalam zona waktu lokal (bukan UTC), format yyyy-mm-dd. */
117: export function todayLocalISO(d = new Date()): string {
118:   return toLocalISO(d);
119: }
120: 
121: export function toLocalISO(d: Date): string {
122:   const y = d.getFullYear();
123:   const m = String(d.getMonth() + 1).padStart(2, '0');
124:   const day = String(d.getDate()).padStart(2, '0');
125:   return `${y}-${m}-${day}`;
126: }
127: 
128: export interface ValidationError {
129:   code: string;
130:   message: string;
131: }

(End of file - total 131 lines)
</content>
```

---

## Assistant (Plan · Big Pickle · 29.4s)

_Thinking:_

I now have a comprehensive understanding. Let me now think about the design of the migration.

Current architecture:
- Draft saved to browser localStorage keyed only by cabangId.
- Autosave debounced 400ms on every change.
- Restore flow: welcome page reads localStorage; input page auto-restores; ShiftCabangGate warns on mismatch.
- Clear on successful submit.

Database = Google Sheets (per-cabang spreadsheet).
- Existing sheets: SO_Transaksi, Laporan_PDF, Master_Item, Kategori_Item, Laporan_Edit_Log, Cabang_Settings.
- Sheets adapter has readSheetData, appendRows, writeRow, setCellValue, findRowIndex, ensureSheet, deleteRow.
- Domain service pattern: resolveCabang(cabangId) → spreadsheetId; read/write sheets.
- Dispatcher: callAppsScript(action, cabangId, payload).
- API route pattern: withAuth + assertCabangAccess.
- Session: SessionData includes userId? Let me check lib/session.ts for SessionData fields.

Need to check userId in session. Let me read lib/session.ts quickly.

Also there's the key constraint: Google Sheets quota — autosave every 400ms to the network is NOT viable. So design must reduce write frequency server-side.

Design decision: Draft sheet `SO_Draft` in each cabang spreadsheet:
Columns:
- User_ID (key)
- Sesi_ID
- Tanggal_Operasional (single value per user)
- Shift
- Note
- Item_ID
- Step1
- Step2
- Keterangan
- Status_Isi
- Tgl_Refill
- Tgl_Pakai
- Updated_At

Or simpler: single JSON blob per user row:
- User_ID | Cabang_ID... actually per-cabang spreadsheet already, so: User_ID | Draft_JSON | Updated_At. But JSON in a cell could exceed 50k chars with large item counts. For ~200 items, each small JSON, might be around ~20-30KB — within 50k char cell limit but risky. Normalized rows are safer.

However, each save = delete old rows + append new rows. That's 2+ API calls per save. Too heavy for 400ms debounce.

Mitigation: The client should debounce more aggressively (e.g., 1.5s to 2s idle), and we only save full state. And important: user experience—the whole point of server-side draft is cross-device. But autosaving whole draft on each keystroke to Sheets would be too chatty and costly.

Alternative approach for given scale: Store each draft as ONE row per user in `SO_Draft` sheet, with the counts encoded as JSON string in a single cell. Single-row layout:
- User_ID | Sesi_ID | Tanggal | Shift | Note | Counts_JSON | Updated_At

Save = upsert single row (needs to update in place or delete+append). writeRow to a known row. Update can be done via findRowIndex then writeRow. 2 API calls on save, but a single save; simpler.

But wait — there might be an even simpler consideration: is migrations to Sheets actually wanted? The user asked "bis gak aku migrasi ke database langsung?" = "can I migrate it directly to the database?" So yes.

Given the constraints, I should present a plan with clear options and tradeoffs, and ask clarifying questions:

1. Where to store: per-cabang spreadsheet new sheet `SO_Draft` (consistent with existing architecture) vs central registry sheet. Recommend per-cabang.

2. Considering Sheets quota: network-per-keystroke autosave isn't feasible. Recommend debounce 1.5-2s + a fallback. Actually, let me check quota: Sheets API default quota is 300 read requests/min/project and 60 write requests/min per user, 300/min per project. Debounced 400ms would be 150 writes/min → exceeds per-user write quota (60/min). So definitely need to reduce. Options: debounce to every keystroke → 1s minimum; but that's still 60/min. Use e.g. idle 2s + also save on blur/unmount. Better: keep a local staging and flush every N seconds if dirty, with N ~30s? But then cross-device isn't real-time anyway. Best practice: debounce ~2s idle. Given writes are frequent while typing counts, 2s idle between keystrokes is realistic. And each save deletes+appends. Hmm, 2 operations per save. Per-user quota 60 writes/min allows 30 saves/min → 2s cadence max. Tight but OK-ish. Could combine: instead of delete+append, overwrite the single row via writeRow to a fixed cell range, which is 1 API call. Actually we could always write draft at the same row index per user after find; find is a read. So per save: 1 read (find row) + 1 write. Or keep an in-memory mapping? No, between serverless calls unreliable.

Better to update the row in-place with a single read + single write, or even simpler: read all rows once, find by User_ID, then writeRow the found row's row-number. That's 2 calls per save. Alternatively, store one row per user and use `values.append` with overwrite... append always adds rows, no upsert.

Could we reduce to a single call with `spreadsheets.values.batchUpdate`? Still need to know the row number → read required. Unless we write to a fixed cell using the User_ID as the row index offset (hash). Fragile.

Given the scale (small, internal tool, few users), 2 API calls per save with 2s debounce is acceptable (max ~30 saves/min per user). But combined with all other activity it could hit project quota (300 writes/min/project). Realistically OK.

Actually, I want to reconsider: simpler and more robust = JSON blob single row per user. Keeping counts in one cell means ONE row per user; save = find user row + write same row. Plus a timestamp. Data loss window minimal.

Let me also verify SessionData has userId.

Also need to review:
- welcome/page.tsx, ShiftCabangGate getDraftShift — these read localStorage. For migration, we introduce a client hook `useSODraft` backed by API, or a small draft api call layer. But the input page currently loads draft synchronously within fetchData; now it'll need an extra fetch to `/api/so/draft`.

- The `shift` mismatch gate uses draft.shift. With server drafts, ShiftCabangGate's getDraftShift needs to become async or receive the loaded draft prop.

Let me check session.ts for SessionData shape.





**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/lib/session.ts"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/lib/session.ts</path>
<type>file</type>
<content>
1: // lib/session.ts
2: // Session management via httpOnly cookies (server-side only)
3: // Uses HMAC-SHA256 signed tokens for tamper-proof sessions
4: 
5: import crypto from 'crypto';
6: import { NextRequest } from 'next/server';
7: import { getEnv } from '@/lib/env';
8: 
9: const SESSION_SECRET = getEnv().STOKIS_API_KEY;
10: const COOKIE_NAME = 'stokis_session';
11: const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
12: 
13: export interface SessionData {
14:   username: string;
15:   nama: string;
16:   role: 'admin' | 'petugas';
17:   cabangId: string;
18:   exp: number;
19: }
20: 
21: /**
22:  * Create a signed session token (HMAC-SHA256)
23:  */
24: export function createSessionToken(data: Omit<SessionData, 'exp'>): string {
25:   const payload: SessionData = {
26:     ...data,
27:     exp: Date.now() + SESSION_MAX_AGE * 1000,
28:   };
29:   const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
30:   const signature = crypto
31:     .createHmac('sha256', SESSION_SECRET)
32:     .update(encoded)
33:     .digest('base64url');
34:   return `${encoded}.${signature}`;
35: }
36: 
37: /**
38:  * Verify and decode a session token.
39:  * Returns null if invalid or expired.
40:  */
41: export function verifySessionToken(token: string): SessionData | null {
42:   const [encoded, signature] = token.split('.');
43:   if (!encoded || !signature) return null;
44: 
45:   const expectedSignature = crypto
46:     .createHmac('sha256', SESSION_SECRET)
47:     .update(encoded)
48:     .digest('base64url');
49: 
50:   // Constant-time comparison
51:   if (signature.length !== expectedSignature.length) return null;
52:   let mismatch = 0;
53:   for (let i = 0; i < signature.length; i++) {
54:     mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
55:   }
56:   if (mismatch !== 0) return null;
57: 
58:   try {
59:     const payload: SessionData = JSON.parse(
60:       Buffer.from(encoded, 'base64url').toString()
61:     );
62:     if (!payload.exp || payload.exp < Date.now()) return null;
63:     return payload;
64:   } catch {
65:     return null;
66:   }
67: }
68: 
69: /**
70:  * Read session from request cookies (server-side)
71:  */
72: export function getSessionFromRequest(request: NextRequest): SessionData | null {
73:   const token = request.cookies.get(COOKIE_NAME)?.value;
74:   if (!token) return null;
75:   return verifySessionToken(token);
76: }
77: 
78: /**
79:  * Set-Cookie header for login
80:  */
81: export function setSessionCookieHeader(token: string): string {
82:   const isProd = process.env.NODE_ENV === 'production';
83:   return [
84:     `${COOKIE_NAME}=${token}`,
85:     'Path=/',
86:     'HttpOnly',
87:     // Secure flag only in production (HTTPS) environments
88:     ...(isProd ? ['Secure'] : []),
89:     'SameSite=Strict',
90:     `Max-Age=${SESSION_MAX_AGE}`,
91:   ].join('; ');
92: }
93: 
94: /**
95:  * Set-Cookie header for logout (clear)
96:  */
97: export function clearSessionCookieHeader(): string {
98:   return [
99:     `${COOKIE_NAME}=`,
100:     'Path=/',
101:     'HttpOnly',
102:     'Secure',
103:     'SameSite=Strict',
104:     'Max-Age=0',
105:   ].join('; ');
106: }

(End of file - total 106 lines)
</content>
```

**Tool: grep**

**Input:**
```json
{
  "include": "*.tsx",
  "pattern": "session|userId|User_ID",
  "path": "/home/bradley/project/stokis-project/lib/AuthContext.tsx"
}
```

**Output:**
```
Found 1 matches
/home/bradley/project/stokis-project/lib/AuthContext.tsx:
  Line 30:     // Ambil session dari server (httpOnly cookie) bukan localStorage

```

---

## Assistant (Plan · Big Pickle · 196.9s)

_Thinking:_

SessionData has `username`, `nama`, `role`, `cabangId`, `exp`. No `userId`. For draft keying by user, we can use `username` as the user key. Alternatively, key by cabang only (like now) to keep behavior identical. But since the whole point is cross-device sync, using username is more robust on shared devices.

Now I have enough to formulate a plan. Let me consider the tradeoffs and ask clarifying questions.

Key concerns/decisions:

1. **Storage location**: New `SO_Draft` sheet in each cabang's spreadsheet (per-cabang), consistent with existing architecture. Rows keyed by `Username`.

2. **Row format**: 
   - Option A: One row per user with `Counts_JSON` blob in a cell. Simple upsert (find by Username, write single row). Less API chatter. Risk: cell 50k char limit; but for ~200 items OK.
   - Option B: Normalized rows (one per item) like SO_Transaksi. More sheet-like, consistent with the app's own data model, but save = delete + append, more API calls.

3. **Write frequency / Sheets quota**: Current 400ms debounce would generate ~150 writes/min → exceeds Google Sheets write quota (60/min/user). Must change to a longer debounce (e.g. 1.5–2s idle) OR (better) keep local staging + periodic flush. This changes UX (draft not saved on every keystroke). Also cross-device sync becomes "eventual". Off-networking: if the server write fails, we should keep a local fallback so user doesn't lose data.

4. **Offline resilience**: The current localStorage benefits offline editing. If we go server-only, offline edits are lost on refresh. Recommend hybrid: server as source of truth + localStorage as local cache/fallback. But user asked "migrasi ke database langsung" - direct to DB. I should raise this tradeoff.

5. **Multi-user collision**: currently keyed by cabang only (shared device collisions). Add username.

6. **ShiftCabangGate / welcome page**: `getDraftShift` becomes async fetch to server. Need API for reading.

7. **Cleanup**: Auto-clean stale drafts (older than N days) to avoid unbounded sheet growth? Could clean on read.

8. **API routes**:
   - `GET /api/so/draft?cabang=...` → loads draft for session.username
   - `PUT /api/so/draft` → upsert (body: cabangId, tanggalOperasional, shift, note, sesiId, counts)
   - `DELETE /api/so/draft?cabang=...` → clear
   All wrapped with withAuth + assertCabangAccess.

9. **Dispatcher**: add cases `getSODraft`, `saveSODraft`, `clearSODraft` mapping to methods in new `lib/domain/so-draft-service.ts`.

10. **Domain service**: `lib/domain/so-draft-service.ts` with `getSODraft(cabangId, username)`, `saveSODraft(cabangId, username, draft)`, `clearSODraft(cabangId, username)`. Uses `ensureSheet` to lazily create `SO_Draft` headers, `readSheetData`/`findRowIndex`/`writeRow`/`appendRows`.

11. **Client refactor**:
   - `app/so/input/page.tsx`: replace local `saveDraft/loadDraft/clearDraft` with async API calls. Change debounce; save with retry; on restore failure fall back to nothing (or local cache). Keep localStorage as fallback cache.
   - `app/so/input/welcome/page.tsx`: fetch draft from API instead of localStorage.
   - `components/ShiftCabangGate.tsx`: getDraftShift becomes async or pass loaded draft.

12. **Storage format normalization**: Draft counts currently keyed by Item_ID. Server-side we could store counts as JSON.

Also need to consider: keep localStorage fallback so that even if offline, and hybrid sync. I think best to ask the user their preferences on:
- Scope: only SO form? (Yes, it's the only draft feature)
- Storage model: JSON-blob per user vs normalized rows
- Sync behavior: save every ~2s idle vs periodic + on-leave; and whether offline fallback (localStorage cache) is desired.
- Keying user: per user now?

Given the breadth, I'll ask a few clarifying questions, then present the plan. Actually plan mode says to ask clarifying questions where tradeoffs exist. Let me ask 2-3 questions.

Let me ask:
1. Format/location: per-cabang spreadsheet `SO_Draft` sheet — confirm + row layout (JSON blob row vs normalized item rows). I'll recommend JSON blob row (single row per user) for write efficiency.
2. Keep offline fallback (hybrid) or pure server?
3. Autosave cadence acceptable? Google Sheets quota limit.

Actually I can bundle these into one question set. Let me ask.

Let me phrase in Indonesian since user speaks Indonesian.

Saya sudah paham arsitekturnya. Sebelum menyusun rencana, ada beberapa keputusan penting karena ada tradeoff (terutama batas kuota Google Sheets API).

**Konteks singkat:** "database" di app ini adalah Google Sheets per-cabang (sheet `SO_Transaksi`, `Laporan_PDF`, dst). Migrasi = simpan draft ke sheet baru `SO_Draft` di spreadsheet cabang, dengan API route baru (`GET/PUT/DELETE /api/so/draft`) + service baru `lib/domain/so-draft-service.ts`, mengikuti pola `callAppsScript` yang sudah ada.

**Masalah utama:** autosave sekarang di-debounce **400ms** ke localStorage. Kalau langsung ke Sheets API, itu ~150 write/menit — **melewati kuota tulis Google Sheets (60/menit/user)**. Jadi frekuensi simpan harus diubah.

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "Format penyimpanan draft di sheet SO_Draft seperti apa?",
      "header": "Format sheet",
      "options": [
        {
          "label": "1 baris JSON per user (Recommended)",
          "description": "Satu baris per user berisi seluruh draft (counts sebagai JSON, sesiId, shift, note, timestamp). Upsert = 1-2 panggilan API per simpan. Paling efisien untuk kuota, cukup untuk ratusan item."
        },
        {
          "label": "Baris normal per item",
          "description": "Mirip SO_Transaksi: satu baris per item, lebih mudah dibaca sebagai spreadsheet, tapi setiap simpan harus hapus semua baris lama + append baru (lebih banyak panggilan API)."
        }
      ]
    },
    {
      "question": "Karena draft jadi di server (membutuhkan koneksi), apakah tetap pakai localStorage sebagai cadangan offline?",
      "header": "Fallback offline",
      "options": [
        {
          "label": "Hybrid: server + cache local (Recommended)",
          "description": "Server jadi sumber utama (sinkron antar perangkat), localStorage tetap dipakai sebagai cache/fallback supaya data tidak hilang saat offline/write gagal. Seperti autosave biasa + sync."
        },
        {
          "label": "Server murni",
          "description": "Draft hanya di server. Simpler, tapi data pengisian hilang bila koneksi mati saat pengisian dan halaman ditutup."
        }
      ]
    },
    {
      "question": "Frekuensi autosave baru yang aman untuk kuota Sheets?",
      "header": "Frekuensi autosave",
      "options": [
        {
          "label": "Debounce ~2 dtk saat idle (Recommended)",
          "description": "Simpan ke server ~2 detik setelah berhenti mengetik. Wajar dipakai, tetap aman di kuota (maks ~30 simpan/menit per user). Ditambah simpan saat sebelum unload."
        },
        {
          "label": "Periodik + on-leave",
          "description": "Simpan setiap 30 detik jika ada perubahan + saat blur/tutup halaman. Paling hemat kuota, tapi sinkron lintas perangkat lebih lambat."
        }
      ]
    }
  ]
}
```

**Output:**
```
User has answered your questions: "Format penyimpanan draft di sheet SO_Draft seperti apa?"="aku gak paham keduanya, jelaskan kepadaku detailnya", "Karena draft jadi di server (membutuhkan koneksi), apakah tetap pakai localStorage sebagai cadangan offline?"="Hybrid: server + cache local (Recommended)", "Frekuensi autosave baru yang aman untuk kuota Sheets?"="Debounce ~2 dtk saat idle (Recommended)". You can now continue with the user's answers in mind.
```

---

## Assistant (Plan · Big Pickle · 70.7s)

_Thinking:_

The user asked me to explain the two storage formats in detail before deciding. Let me explain both clearly in Indonesian, with examples, then recommend.

Let me write a clear explanation comparing the two formats. Keep it focused. This is informational; then present the full plan perhaps.

Let me explain with a concrete example: a draft for 3 items, user "agus", cabang, etc.

Format A: 1 baris JSON per user.
Sheet SO_Draft columns: Username | Sesi_ID | Tanggal_Operasional | Shift | Note | Counts_JSON | Updated_At
Row example:
agus | SES_xxx | 2026-09-18 | Opening | "catatan" | {"ITEM001":{"step1":"10","step2":"","keterangan":""},...} | 1726650000000

Efficient: to save, find row with Username, then overwrite that row's cells. 1 read + 1 write.

Format B: baris normal per item, each field its own column:
Username | Sesi_ID | Item_ID | Step1 | Step2 | Keterangan | Status_Isi | Tgl_Refill | Tgl_Pakai
agus | SES_xxx | ITEM001 | 10 | | | | |
agus | SES_xxx | ITEM002 | | 5 | | | |

Easier to read in spreadsheet, but each save = delete all old rows for that user + append new rows → 2-3 calls per save, sheet grows with churn.

Let me present this explanation and give a recommendation. Then present the plan. Since user chose hybrid and 2s debounce, I'll build the plan with Format A (recommended) unless they object after the explanation. Actually let me explain and then ask which one they want. But I don't want overly many back-and-forth. I'll explain, recommend Format A, and then in the same message present the full plan with Format A, noting they can switch. Actually the question tool said user wants explanation—I should explain and ask them to pick. Let me explain concisely and ask.

Let me explain using an analogy. Keep it reasonably short but clear.

Oke, saya jelaskan kedua format itu dengan contoh sederhana.

Bayangkan draft untuk 1 user (misal `agus`) yang baru mengisi 2 barang (`ITEM001` step1=10, `ITEM002` step2=5) di cabang `CBG-A`, shift `Opening`, tanggal `2026-09-18`.

**Format A — 1 baris JSON per user**
Sheet `SO_Draft` punya kolom tetap, tapi isi seluruh data draft digabung jadi satu "paket" JSON di satu sel:

```
┌──────────┬──────────┬───────────────────┬─────────┬────────┬─────────────────────────────────────────┬───────────────┐
│ Username │ Sesi_ID  │ Tanggal_Operasional│ Shift  │ Note   │ Counts_JSON                              │ Updated_At    │
├──────────┼──────────┼───────────────────┼─────────┼────────┼─────────────────────────────────────────┼───────────────┤
│ agus     │ SES_a1b │ 2026-09-18        │ Opening │ (kosong) │ {"ITEM001":{"step1":"10","step2":"","keterangan":""},"ITEM002":{"step1":"","step2":"5","keterangan":""}} │ 1726650000000 │
└──────────┴──────────┴───────────────────┴─────────┴────────┴─────────────────────────────────────────┴───────────────┘
```

- Cuma **1 baris** per user → cara simpan = cari baris `agus`, lalu timpa sel-selnya (1 read + 1 write).
- Spreadsheet-nya "jelek dibaca" manusia (isinya JSON panjang), tapi efisien & cepat.

**Format B — baris normal per item**
Kolom per field (mirip sheet `SO_Transaksi` yang sudah ada):

```
┌──────────┬──────────┬─────────┬───────┬───────┬────────────┬───────────┐
│ Username │ Sesi_ID  │ Item_ID │ Step1 │ Step2 │ Keterangan │ Status_Isi │
├──────────┼──────────┼─────────┼───────┼───────┼────────────┼───────────┤
│ agus     │ SES_a1b │ ITEM001 │ 10    │       │            │           │
│ agus     │ SES_a1b │ ITEM002 │       │ 5     │            │           │
└──────────┴──────────┴─────────┴───────┴───────┴────────────┴───────────┘
```

- Enak dibaca/bisa difilter manual di Google Sheets, konsisten dengan data SO.
- Tapi tiap simpan = **hapus semua baris lama user + append baris baru** (2–3 panggilan API per simpan), dan sheet jadi tumbuh/tidak stabil karena banyak hapus-append.

**Rekomendasi saya: Format A.** Alasan: (1) jauh lebih hemat kuota & panggilan API, (2) tiap simpan hanyalah "timpa 1 baris" — tidak ada risiko sheet korup karena hapus/append batu semangat, (3) data draft itu sifatnya sementara dan tidak pernah dibaca manusia langsung dari spreadsheet; yang baca adalah halaman Input SO.



**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "header": "Pilih format sheet",
      "options": [
        {
          "description": "Efisien, hemat kuota, 1 baris per user, isi draft sebagai JSON di satu sel. Direkomendasikan.",
          "label": "Format A — 1 baris JSON per user (Recommended)"
        },
        {
          "description": "Muat dibaca manusia di spreadsheet, tapi lebih banyak panggilan API dan sheet lebih berisiko korup karena sering hapus/append.",
          "label": "Format B — baris normal per item"
        }
      ],
      "question": "Setelah penjelasan di atas, format mana yang dipakai?"
    }
  ]
}
```

**Output:**
```
User has answered your questions: "Setelah penjelasan di atas, format mana yang dipakai?"="Format A — 1 baris JSON per user (Recommended)". You can now continue with the user's answers in mind.
```

---

## Assistant (Plan · Big Pickle · 9.5s)

_Thinking:_

Now I have all the decisions:
- Format A: 1 baris JSON per user in `SO_Draft` sheet in each cabang's spreadsheet.
- Hybrid: server source of truth + localStorage cache/fallback.
- Debounce ~2s idle, + save before unload.

Now let me formulate the final plan. Let me first double check a few things that will be touched:

1. `app/api/so/input/page.tsx` — full draft usage. Let me check where `pendingDraft` and the discard modal are, and how draft restore banner/modal show. Line ~1119 "Draft restore banner - hidden since we now use modal". Let me check ShiftCabangGate props from input page usage. Let me look at input page around lines 1119-1200 for pendingDraft UI and the discard modal. Also need to see how the welcome page connects (router.push('/so/input')). 

Actually I have enough context to write the plan at architecture level. But let me quickly verify a couple of implementation details so the plan is accurate:
- Where the input page declares DRAFT_PREFIX etc — already seen (lines 144-201).
- Input page: uses `pendingDraft` state (set when draft found?) — Actually input page `pendingDraft` is used in the autosave guard: `if (items.length === 0 || pendingDraft) return;`. In input page, `pendingDraft` seems to block autosave while waiting for restore decision — but actually it auto-restores now ("Auto-restore draft instead of showing banner"). Hmm, so pendingDraft may never be set on the input page except... let me check more of input page for pendingDraft set.

Let me search in input page for setPendingDraft.

**Tool: grep**

**Input:**
```json
{
  "include": "page.tsx",
  "path": "/home/bradley/project/stokis-project/app/so/input",
  "pattern": "setPendingDraft|pendingDraft|showDiscardConfirm|handleDiscard|shiftMismatch"
}
```

**Output:**
```
Found 24 matches
/home/bradley/project/stokis-project/app/so/input/welcome/page.tsx:
  Line 69:   const [pendingDraft, setPendingDraft] = useState<SODraft | null>(null);

  Line 80:         setPendingDraft(cached);

  Line 162:             {pendingDraft ? (

  Line 173:                 {pendingDraft ? 'Sesi Belum Selesai' : 'Stock Opname'}

  Line 176:                 {pendingDraft ? 'Ditemukan data yang belum di-submit' : 'Mulai sesi stock opname baru'}

  Line 183:         {pendingDraft && (

  Line 188:                 <p className="font-semibold text-base-content">{pendingDraft.tanggalOperasional || 'Tidak tersedia'}</p>

  Line 192:                 <p className="font-semibold text-base-content">{pendingDraft.shift || 'Tidak tersedia'}</p>

  Line 196:                 <p className="font-semibold text-base-content">{countFilled(pendingDraft.counts)} item terisi</p>

  Line 198:               {pendingDraft.updatedAt && (

  Line 202:                     {new Date(pendingDraft.updatedAt).toLocaleString('id-ID', {

  Line 215:             {pendingDraft.note && (

  Line 218:                 <p className="text-sm text-base-content/80 line-clamp-2">{pendingDraft.note}</p>

  Line 232:           {pendingDraft && (


/home/bradley/project/stokis-project/app/so/input/page.tsx:
  Line 573:   const [pendingDraft, setPendingDraft] = useState<SODraft | null>(null);

  Line 574:   const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  Line 612:     setPendingDraft(null);

  Line 690:     if (items.length === 0 || pendingDraft) return;

  Line 707:   }, [counts, tanggalOperasional, shift, note, cabangId, items.length, pendingDraft]);

  Line 830:   const handleDiscardDraft = () => {

  Line 832:     setPendingDraft(null);

  Line 1060:         setPendingDraft(null);

  Line 1523:         {showDiscardConfirm && (

  Line 1560:                   onClick={handleDiscardDraft}

```

---

## Assistant (Plan · Big Pickle · 6.1s)

_Thinking:_

Now let me read around lines 820-840 for handleDiscardDraft and check pendingDraft logic and ShiftCabangGate usage from input page.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/app/so/input/page.tsx",
  "limit": 120,
  "offset": 810
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/app/so/input/page.tsx</path>
<type>file</type>
<content>
810:   }
811: 
812:   if (!selectedCabang) {
813:     return (
814:       <div className="text-center py-16 card bg-base-100 border border-base-300 rounded-3xl p-8 space-y-3">
815:         <ShieldAlert className="w-12 h-12 text-warning mx-auto" />
816:         <h3 className="text-base font-bold text-base-content">Pilih Cabang Terlebih Dahulu</h3>
817:         <p className="text-base-content/60 text-sm">Silakan pilih cabang aktif melalui switcher di bagian atas navigasi.</p>
818:       </div>
819:     );
820:   }
821: 
822:   // Group filtered items by Area
823:   const groupedItems = filteredItems.reduce((acc, item) => {
824:     const area = item.Area || 'Area Umum';
825:     if (!acc[area]) acc[area] = [];
826:     acc[area].push(item);
827:     return acc;
828:   }, {} as Record<string, MasterItem[]>);
829: 
830:   const handleDiscardDraft = () => {
831:     if (selectedCabang) clearDraft(selectedCabang.Cabang_ID);
832:     setPendingDraft(null);
833:     setNote('');
834:     setShowDiscardConfirm(false);
835:   };
836: 
837:   const buildPayloadItems = (): SOItemPayload[] => {
838:     return items.map((it) => {
839:       const c = counts[it.Item_ID] || { step1: '', step2: '', keterangan: '', statusIsi: undefined, tglRefill: '', tglPakai: '' };
840:       const prev = previousSO[it.Item_ID] || previousSO[it.Nama_Barang] || previousSO[it.Nama_Barang.trim()];
841:       const step1Str = String(c.step1).trim();
842:       const step2Str = String(c.step2).trim();
843:       const step1Num = Number(step1Str);
844:       const step2Num = Number(step2Str);
845:       // Tidak ada auto-fill: kosong = 0
846:       const step1 = step1Str === '' || !Number.isFinite(step1Num) ? 0 : step1Num;
847:       const step2 = step2Str === '' || !Number.isFinite(step2Num) ? 0 : step2Num;
848:       const total = step1 + step2;
849:       const prevKeterangan = prev?.keterangan || '';
850:       const keterangan = c.keterangan.trim();
851: 
852:       // boolean/date — tanpa auto-fill dari prev
853:       const tglRefillInput = (c.tglRefill || '').trim();
854:       const tglRefill = tglRefillInput || '';
855: 
856:       let statusIsi: 'Penuh' | 'Dipakai' | 'Habis' | '';
857:       if (c.statusIsi !== undefined && c.statusIsi !== '') {
858:         statusIsi = c.statusIsi as 'Penuh' | 'Dipakai' | 'Habis';
859:       } else {
860:         statusIsi = '';
861:       }
862: 
863:       const tglPakaiInput = (c.tglPakai || '').trim();
864:       const tglPakai = tglPakaiInput || '';
865: 
866:       return {
867:         itemId: it.Item_ID,
868:         namaBarang: it.Nama_Barang,
869:         satuan: it.Satuan,
870:         area: it.Area,
871:         threshold: it.Threshold,
872:         tipeInput: it.Tipe_Input || '',
873:         step1,
874:         step2,
875:         total,
876:         keterangan,
877:         prevStep1: prev?.step1 ?? null,
878:         prevStep2: prev?.step2 ?? null,
879:         prevTotal: prev?.total ?? null,
880:         prevTanggal: prev?.tanggal ?? null,
881:         prevShift: prev?.shift ?? null,
882:         prevKeterangan,
883:         statusIsi,
884:         tglRefill,
885:         tglPakai,
886:         prevStatusIsi: prev?.statusIsi ?? null,
887:         prevTglRefill: prev?.tglRefill ?? null,
888:         prevTglPakai: prev?.tglPakai ?? null,
889:       };
890:     });
891:   };
892: 
893:   const handleSubmit = (e: React.FormEvent) => {
894:     e.preventDefault();
895: 
896:     if (!sesiIdRef.current) {
897:       sesiIdRef.current = generateSesiId();
898:     }
899: 
900:     // Validasi: semua field wajib diisi sesuai tipe input
901:     const emptyFields: string[] = [];
902:     items.forEach((it) => {
903:       const c = counts[it.Item_ID];
904:       const tipe = parseTipeInput(it.Tipe_Input);
905:       const primary = tipe[0];
906: 
907:       if (primary === 'dual' || primary === 'single') {
908:         if (!c?.step1?.trim()) emptyFields.push(`${it.Nama_Barang}: S1 kosong`);
909:         if (primary === 'dual' && !c?.step2?.trim()) emptyFields.push(`${it.Nama_Barang}: S2 kosong`);
910:       }
911:       if (tipe.includes('boolean')) {
912:         if (!c?.statusIsi) emptyFields.push(`${it.Nama_Barang}: Status Isi belum dipilih`);
913:       }
914:       if (tipe.includes('date')) {
915:         if (!c?.tglRefill?.trim()) emptyFields.push(`${it.Nama_Barang}: Tgl Refill kosong`);
916:       }
917:       if (tipe.includes('expiry')) {
918:         if (!c?.tglRefill?.trim()) emptyFields.push(`${it.Nama_Barang}: Tgl Kedaluwarsa kosong`);
919:       }
920:     });
921: 
922:     if (emptyFields.length > 0) {
923:       const preview = emptyFields.slice(0, 5).join('\n');
924:       const more = emptyFields.length > 5 ? `\n... dan ${emptyFields.length - 5} lainnya` : '';
925:       toast.error('Wajib isi semua kolom:', `${preview}${more}`);
926:       return;
927:     }
928: 
929:     const payloadItems = buildPayloadItems();

(Showing lines 810-929 of 1736. Use offset=930 to continue.)
</content>
```

---

## Assistant (Plan · Big Pickle · 64.2s)

_Thinking:_

Now I have all the info I need. Let me write the plan.

Key decisions:
- Format A: 1 JSON row per user in `SO_Draft` sheet in cabang spreadsheet.
- Hybrid: server = source of truth + localStorage cache fallback.
- Autosave debounce ~2s idle + save before unload.
- Keying by `username` (from session), keyed per cabang per user.
- API routes + domain service + dispatcher.

Let me outline the plan:

1. **Add sheet schema** — New sheet `SO_Draft` in each cabang spreadsheet with headers:
   `Username | Sesi_ID | Tanggal_Operasional | Shift | Note | Counts_JSON | Updated_At`
   Ensure created lazily via `ensureSheet`.

2. **New domain service: `lib/domain/so-draft-service.ts`**
   - `getSODraft(cabangId: string, username: string): Promise<SODraft | null>`
   - `saveSODraft(cabangId: string, username: string, draft: SODraftPayload): Promise<void>`
   - `clearSODraft(cabangId: string, username: string): Promise<void>`
   - `cleanStaleDrafts(cabangId: string, olderThanDays?: number): Promise<void>` (optional cleanup)
   Implementation:
   - `ensureSheet(spreadsheetId, 'SO_Draft', DRAFT_HEADERS)` on get/save.
   - get: `readSheetData` → `findRowIndex` on Username, if found return JSON parsed.
   - save: `findRowIndex` → if exists `writeRow` at that index (overwrite) else `appendRows` one row.
   - clear: same `findRowIndex` → `deleteRow`.
   - cleanStale: read all, for rows Updated_At older than 30 days deleteRow in reverse order.

3. **Update dispatcher `lib/appsscript.ts`**
   Add cases:
   - `getSODraft`: call `getSODraft(cabangId, String(p.username))`
   - `saveSODraft`: call `saveSODraft(cabangId, String(p.username), p.draft)`
   - `clearSODraft`: call `clearSODraft(cabangId, String(p.username))`

4. **New API routes**
   - `app/api/so/draft/route.ts`:
     - `GET ?cabang=...` → withAuth + assertCabangAccess, extracts `session.username`, returns `{ success, data: SODraft | null }`
     - `PUT` body: `{ cabangId, ...draftFields }` → upsert, returns `{ success, data: { saved: true } }`
     - `DELETE ?cabang=...` → clear, returns `{ success, data: { cleared: true } }`

5. **Shared client helper `lib/draft-client.ts`** (or just integrate in page files)
   - Provides `fetchSaveDraft(cabangId, draft)`, `fetchLoadDraft(cabangId)`, `fetchClearDraft(cabangId)`
   - Keeps localStorage as cache: on load, try API first; on error fall back to local cache; on save, write to localStorage as cache before async write to server.

6. **Refactor `app/so/input/page.tsx`**
   - Remove local `saveDraft/loadDraft/clearDraft` (or keep as local cache layer).
   - Add async load on mount: in `fetchData` after items loaded, call `loadDraft` from server; restore via `handleRestoreDraft` (async now, but essentially same).
   - Replace autosave: in useEffect on `counts/...`, debounced 2s idle, call async `saveDraft` to server (fire-and-forget with local cache write).
   - `handleDiscardDraft` calls async `clearDraft`.
   - `handleSubmit` success calls async `clearDraft`.
   - `pendingDraft` guards autosave remain same; note: `handleRestoreDraft` now might need to be async? Actually `handleRestoreDraft` is synchronous setting state; that's fine. The async part is just fetching the draft before restore.
   - `beforeunload`: ensure `saveDraft` runs synchronously to localStorage (keep local) before `navigator.sendBeacon`? Actually we can't block async server write. So `beforeunload` continues to save to localStorage as safety; the async `saveDraft` will have already been triggered by the latest debounce? Or we add a synchronous localStorage save in `beforeunload` and let the server catch up later. Hybrid means localStorage cache is acceptable.

7. **Refactor `app/so/input/welcome/page.tsx`**
   - On mount, instead of `loadDraft` from localStorage, call `loadDraft` from server (with cache fallback).
   - Show pending draft info after fetch completes.
   - Keep "Lanjutkan" / "Mulai Baru" same, but "Mulai Baru" calls `clearDraft` on server + local.
   - `isLoading` may stay longer for network fetch; need loading indicator.

8. **Update `components/ShiftCabangGate.tsx`**
   - `getDraftShift` currently sync: `() => { const d = loadDraft(cabangId); return d.shift; }`. To avoid async prop, instead we can pass the already-loaded draft shift from parent (welcome page passes it). Or we can accept a `draftShiftMap` prop or compute in parent and pass as prop.
   - Simpler: ShiftCabangGate receives optional `currentDraftShift` prop for the selected cabang, set after parent loads draft. The gate updates when `cabangId` changes. This is synchronous if parent precomputes.
   - Alternative: make `getDraftShift` return string | null synchronously from localStorage cache, while async load updates state elsewhere. Since we keep localStorage as cache, this may still work: client loads from localStorage immediately (synchronous, for gate), then async from server to sync. The gate may be slightly stale but it's okay (guard is for mismatch only; if user changes shift to the actual draft shift it's fine).
   - Best approach: keep `ShiftCabangGate` using a local cache read (from localStorage) for initial `getDraftShift` — that keeps it simple. After we implement hybrid, localStorage will be synced with server on load. So `getDraftShift` can still read localStorage synchronously for the gate. No changes to gate required for initial implementation. But we need to ensure localStorage is synced on app load.

Actually, with hybrid, we want localStorage to be an up-to-date cache. So the flow:
- On page load / app start, fetch draft from server, write to localStorage as cache, then use it locally.
- On autosave, write to localStorage + async fire server.
- So `ShiftCabangGate.getDraftShift` reading localStorage is fine.

Wait, but `welcome/page.tsx` uses `loadDraft` (local) on mount. If we change welcome to fetch from server, it adds delay but gets truth. To keep UX fast, we could read from localStorage first (synchronous), show pending draft, then async fetch from server to refresh cache. That might be good: always load from local first for instant UI, async sync from server to stay fresh.

Thus the gate and welcome page both read from localStorage instantly; on mount we kick off server sync and update state if changed.

Let me define the client strategy:

**Client strategy (hybrid):**
- **localStorage key**: keep `stokis_so_draft_{cabangId}` same.
- **Load**: on mount, read localStorage instantly to populate UI. Fire async `GET /api/so/draft?cabang=` → on success, write to localStorage, update state if data differs.
- **Save (autosave)**: debounce 2s → write to localStorage immediately (synchronous for offline safety), then fire async `PUT /api/so/draft`.
- **Clear**: remove localStorage + fire async `DELETE /api/so/draft`.
- **beforeunload**: ensure final sync via `PUT /api/so/draft` triggered; but as it's async may not complete. localStorage already written.
- **Offline / server write failure**: silently swallow server error (local cache has data). If user opens on different device, they won't see draft — acceptable per hybrid design.

Now, let me outline files changed and testing considerations.

Test adjustments: existing tests? There are none for draft currently, likely none for SO. We can add minimal tests or note to verify manually.

Also need to ensure we don't exceed Sheets quota combined with other operations. 2s debounce ≈ 30 writes/min worst case per user. With multiple concurrent users on same project, project quota (300/min) could be hit. But app is small (internal tool), and normal typing has pauses. Acceptable. Could add optional global rate limiter but likely unnecessary.

One more consideration: the draft sheet `SO_Draft` should only live in per-cabang spreadsheet (not registry) because it's per-cabang data. Creating lazily via `ensureSheet` on first save/get is fine; no migration needed because `ensureSheet` creates sheet + headers if missing.

Also cleanup: stale drafts (e.g., older than 7 days) should be cleaned occasionally to prevent unbounded growth. Could run clean on GET or on save. But GET can't block on it efficiently. Options: add a small cleanup in `saveSODraft` (if random chance or if rows count > threshold, clean old), or add an admin API/cron. For simplicity, add `cleanStaleDrafts` call inside `saveSODraft` with a probabilistic trigger (e.g., ~5% of saves). That spreads cost.

Alternatively, just limit maximum rows to, say, 50 by always keeping latest 50 usernames.

For now, include a basic cleanup function and can trigger it in `saveSODraft` when row count > N.

Let's write the plan. Use concise bullet points. Keep sections:
- Overview
- Sheet schema
- Domain service
- Dispatcher changes
- API routes
- Client changes (pages, helpers)
- Autosave behavior
- Testing / verification

That's it.

Baik, berikut rencana lengkap migrasi sistem draft dari localStorage ke Google Sheets (database), dengan hybrid cache lokal.

---

## Rencana: Migrasi SO Draft ke Database (Google Sheets)

### Ringkasan Keputusan
- **Format:** 1 baris JSON per user di sheet `SO_Draft` per cabang (sheet baru, dibuat otomatis).
- **Hybrid:** Server jadi sumber kebenaran; localStorage tetap dipakai sebagai cache/fallback offline & untuk UI instan.
- **Autosave:** Debounce **2 detik saat idle** + simpan saat `beforeunload`.
- **User key:** `username` dari session (bukan hanya cabang).

---

### 1. Sheet schema — `SO_Draft`

Ditambahkan ke spreadsheet cabang via `ensureSheet` saat pertama dipanggil (lazy).

Headers:
```
Username | Sesi_ID | Tanggal_Operasional | Shift | Note | Counts_JSON | Updated_At
```

- `Counts_JSON`: JSON string berisi `Record<string, { step1, step2, keterangan, statusIsi?, tglRefill?, tglPakai? }>`, sama seperti `SODraft.counts`.
- `Updated_At`: epoch ms.
- **Pembacaan:** `findRowIndex` pada kolom `Username` → jika ada, timpa baris itu; jika tidak, append baris baru.
- **Cleanup:** Hapus baris dengan `Updated_At` lebih tua dari 30 hari, dilakukan acak (~5% dari operasi save) atau ketika jumlah baris > 50, agar sheet tidak tumbuh tak terbatas.

---

### 2. Domain service baru — `lib/domain/so-draft-service.ts`

Fungsi-fungsi berikut menggunakan helper yang sudah ada (`readSheetData`, `sheetToObjects`, `findRowIndex`, `writeRow`, `appendRows`, `deleteRow`, `ensureSheet`).

```ts
// lib/domain/so-draft-service.ts

const DRAFT_SHEET = 'SO_Draft';
const DRAFT_HEADERS = [
  'Username', 'Sesi_ID', 'Tanggal_Operasional', 'Shift',
  'Note', 'Counts_JSON', 'Updated_At',
];

export interface SODraftData {
  counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>;
  sesiId: string;
  tanggalOperasional: string;
  shift: string;
  note: string;
  updatedAt: number;
}

/** Ambil draft untuk 1 user di 1 cabang. */
export async function getSODraft(cabangId: string, username: string): Promise<SODraftData | null>;

/** Upsert (overwrite atau append) draft 1 user. */
export async function saveSODraft(cabangId: string, username: string, draft: SODraftData): Promise<void>;

/** Hapus draft 1 user. */
export async function clearSODraft(cabangId: string, username: string): Promise<void>;

/** Bersihkan draft berumur > `olderThanDays` (default 30). */
export async function cleanStaleDrafts(cabangId: string, olderThanDays?: number): Promise<number>;
```

---

### 3. Dispatcher — `lib/appsscript.ts`

Tambahkan 3 case baru di `callAppsScript`:

```ts
case 'getSODraft':
  return ok<T>(await getSODraft(cabangId!, String(p.username)) as T);
case 'saveSODraft':
  return ok<T>(await saveSODraft(cabangId!, String(p.username), p.draft as SODraftData) as T);
case 'clearSODraft':
  return ok<T>(await clearSODraft(cabangId!, String(p.username)) as T);
```

Import `getSODraft, saveSODraft, clearSODraft` dari `lib/domain/so-draft-service`.

---

### 4. API routes — `app/api/so/draft/route.ts`

Satu file, tiga handler dengan `withAuth` + `assertCabangAccess`.

```ts
// GET  /api/so/draft?cabang=...
export const GET = withAuth(async (req, _ctx, session) => {
  const cabangId = new URL(req.url).searchParams.get('cabang');
  if (!cabangId) return jsonError(400);
  assertCabangAccess(session, cabangId);
  const result = await callAppsScript('getSODraft', cabangId, { username: session.username });
  return NextResponse.json(result);
});

// PUT  /api/so/draft  body: { cabangId, counts, sesiId, tanggalOperasional, shift, note, updatedAt }
export const PUT = withAuth(async (req, _ctx, session) => {
  const body = await req.json();
  if (!body.cabangId) return jsonError(400);
  assertCabangAccess(session, body.cabangId);
  const draft: SODraftData = { ...body, username: session.username };
  const result = await callAppsScript('saveSODraft', body.cabangId, { username: session.username, draft });
  return NextResponse.json(result);
});

// DELETE /api/so/draft?cabang=...
export const DELETE = withAuth(async (req, _ctx, session) => {
  const cabangId = new URL(req.url).searchParams.get('cabang');
  assertCabangAccess(session, cabangId);
  const result = await callAppsScript('clearSODraft', cabangId, { username: session.username });
  return NextResponse.json(result);
});
```

---

### 5. Client helper — `lib/draft-client.ts`

Modul baru di sisi client (importable di page components) yang menggabungkan localStorage cache + server API.

```ts
// lib/draft-client.ts
// Imported by pages — runs in browser

import type { SODraftData } from '@/lib/domain/so-draft-service';

const DRAFT_PREFIX = 'stokis_so_draft_';
function getDraftKey(cabangId: string) { return DRAFT_PREFIX + cabangId; }

// --- localStorage helpers (synchronous) ---
export function readDraftCache(cabangId: string): SODraftData | null;
export function writeDraftCache(cabangId: string, draft: SODraftData): void;
export function clearDraftCache(cabangId: string): void;

// --- Server API wrappers (async) ---
export async function apiGetDraft(cabangId: string): Promise<SODraftData | null>;
export async function apiPutDraft(cabangId: string, draft: SODraftData): Promise<void>;
export async function apiDeleteDraft(cabangId: string): Promise<void>;

// --- Hybrid helpers ---
export async function loadDraftHybrid(cabangId: string): Promise<SODraftData | null> {
  // 1. Return localStorage instantly (if exists) for instant UI
  // 2. Fire server fetch in background
  // 3. On server success: update localStorage cache + return updated data
  //    On failure: keep localStorage, swallow error
}

export async function saveDraftHybrid(cabangId: string, draft: SODraftData): Promise<void> {
  // 1. Write to localStorage immediately (sync)
  // 2. Fire PUT to server (async, fire-and-forget; swallow error)
}

export async function clearDraftHybrid(cabangId: string): Promise<void> {
  // 1. Remove localStorage
  // 2. Fire DELETE to server (fire-and-forget)
}
```

---

### 6. Refactor `app/so/input/page.tsx`

Perubahan utama:
- **Import:** Ganti `loadDraft/clearDraft` lokal dengan `loadDraftHybrid/saveDraftHybrid/clearDraftHybrid` dari `lib/draft-client`.
- **`SODraft` interface:** Duplikasi sudah ada; bisa dihapus dan diimpor dari `lib/domain/so-draft-service` (atau tetap duplikat untuk kompatibilitas client-only) — gunakan path type-only `import type` atau deklarasi ulang lokal.
- **Autosave useEffect:** Ubah debounce dari 400ms → 2000ms. Ganti body dari `saveDraft(...)` → `saveDraftHybrid(...)`.
- **`fetchData`:** Setelah items dimuat, panggil `loadDraftHybrid(...)` (async), lalu `handleRestoreDraft(cached)` jika ada data.
- **`handleDiscardDraft`:** Panggil `clearDraftHybrid(selectedCabang.Cabang_ID)`.
- **`handleSubmit` success:** Panggil `clearDraftHybrid(selectedCabang.Cabang_ID)`.
- **`beforeunload`:** Tetap tulis ke localStorage langsung (sudah dilakukan `saveDraftHybrid` sync awal), tidak perlu perubahan khusus.

**Catatan `pendingDraft` state:** Saat ini `pendingDraft` di input page dipakai untuk menahan autosave sementara menunggu keputusan restore; namun sekarang auto-restore langsung (tanpa banner). `pendingDraft` bisa dihapus dari input page, atau tetap dipertahankan sebagai flag sederhana. Rekomendasi: pertahankan logika existing tapi tumpu pada async load.

---

### 7. Refactor `app/so/input/welcome/page.tsx`

Perubahan:
- **Import** `loadDraftHybrid/clearDraftHybrid/countFilled` dari `lib/draft-client` (atau buat `countFilled` juga di sana). Duplikasi `SODraft` interface bisa dihapus.
- **useEffect mount:** Jalankan `loadDraftHybrid(draftCabangId)` async → update `pendingDraft` state setelah selesai. Sedikit delay tapi di-cache local untuk instant render.
- **`handleLanjutkan`:** Tetap `router.push('/so/input')` — tidak berubah.
- **`handleMulaiBaru`:** Panggil `clearDraftHybrid(cabangId)`.

**ShiftCabangGate:** Tidak perlu diubah. `getDraftShift` tetap baca localStorage (sync) → selalu up-to-date karena hybrid menulis localStorage dulu. Dapat tetap berfungsi normal.

---

### 8. Cleanup stale rows (opsional namun disarankan)

Di dalam `saveSODraft`:

```ts
// Di dalam saveSODraft, setelah append rows:
if (Math.random() < 0.05) { // ~5% of saves
  await cleanStaleDrafts(cabangId, 30);
}
```

Atau cek `rows.length > 50` → bersihkan yang paling tua. Ini menjaga sheet tetap kecil.

---

### 9. Deployment / migrasi

- Tidak ada data migration dari localStorage ke server; localStorage tetap dipakai sebagai cache lokal. Pertama kali user save, draft ter写下 ke sheet.
- `ensureSheet` membuat `SO_Draft` otomatis saat request pertama. Tidak perlu perubahan manual di Google Sheets.
- User existing tidak kehilangan data; localStorage masih ada. Setelah deploy, session baru akan sync ke server.

---

### 10. Testing / Verifikasi

- **Manual:** Buka `/so/input`, isi beberapa item, refresh → draft harus restore dari server (localStorage di-cache juga). Buka di perangkat/tab lain dengan user yang sama → harus muncul draft yang sama (setelah autosave trigger).
- **Unit test** (tambahkan ke `test/so-draft-service.test.js`): mock `readSheetData/findRowIndex/appendRows/writeRow/deleteRow`, test `getSODraft` (ada/tidak), `saveSODraft` (append vs update), `clearSODraft`, `cleanStaleDrafts`.
- Jalankan `npm run lint` dan `npm run typecheck` (jika ada) atau `npm run build` setelah perubahan.

---

Apakah ada pertanyaan atau bagian yang ingin diubah sebelum saya mulai implementasi?

---

## User

jadi json itu tersimpan dimana?

---

## Assistant (Plan · Big Pickle · 10.4s)

_Thinking:_

The user asks: "jadi json itu tersimpan dimana?" — "so where is that JSON stored?"

They want to understand where the JSON is stored. Answer clearly: JSON stored in a single cell of a row in the `SO_Draft` sheet inside the per-cabang Google Spreadsheet. Let me explain concisely with the location chain.

Location: The `SO_Draft` sheet is inside the **spreadsheet milik cabang** (per-cabang spreadsheet, which is referenced by `Spreadsheet_ID` in the registry sheet `Daftar_Cabang` in the REGISTRY_SPREADSHEET_ID). Each cabang has its own spreadsheet, resolved via `resolveCabang(cabangId)`. So JSON per user goes in a cell, e.g., `SO_Draft!F2` (column F = Counts_JSON), row of that user.

So it's stored in the same database (Google Sheets) that stores SO_Transaksi etc. — not in a separate database, not in Vercel, not in localStorage (except as cache copy).

Let me answer concisely.

JSON draft itu tersimpan di **Google Sheets — spreadsheet milik cabang**, tepatnya:

1. **Tempat final:** Sheet `SO_Draft` di dalam *spreadsheet cabang* (yang sama berisi `SO_Transaksi`, `Laporan_PDF`, `Master_Item`). Tiap cabang punya spreadsheet sendiri, lokasinya dicatat di registry `Daftar_Cabang` → kolom `Spreadsheet_ID`.
2. **Barisnya:** keyed per user → 1 baris per `username`. Kolom `Counts_JSON` (satu sel, mis. `SO_Draft!F2`) berisi seluruh isian draft sebagai string JSON.
3. **Alur aksesnya:** API route → `callAppsScript('saveSODraft')` → service pakai `resolveCabang(cabangId)` untuk dapat `spreadsheetId` → `writeRow/appendRows` ke cell itu. Sama persis seperti bagaimana `submitSO` menulis ke `SO_Transaksi`.

Jadi tidak ada database baru — datanya mendarat di Google Sheets yang sama dengan data operasional lain. Di `localStorage` browser hanya ada **salinan cache** (hybrid), bukan sumber utama.

---

## User

oke kita keep dulu, sekarang terkait dengan so/input/welcome, ini fungsinya apa?

---

## Assistant (Plan · Big Pickle · 41.5s)

_Thinking:_

The user asks what the function of `app/so/input/welcome` page is. Let me read the welcome page thoroughly to explain its purpose. I already read it earlier but let me review it again fully to give a clear answer.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/app/so/input/welcome/page.tsx"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/app/so/input/welcome/page.tsx</path>
<type>file</type>
<content>
1: 'use client';
2: 
3: import React, { useState, useEffect, useCallback } from 'react';
4: import { useRouter } from 'next/navigation';
5: import { motion, AnimatePresence } from 'framer-motion';
6: import { useCabang } from '@/lib/CabangContext';
7: import { useAuth } from '@/lib/AuthContext';
8: import {
9:   ClipboardCheck,
10:   AlertTriangle,
11:   RotateCcw,
12:   Plus,
13:   HardDrive,
14:   ArrowLeft,
15: } from 'lucide-react';
16: import { ShiftCabangGate } from '@/components/ShiftCabangGate';
17: 
18: const DRAFT_PREFIX = 'stokis_so_draft_';
19: 
20: interface SODraft {
21:   counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>;
22:   sesiId: string;
23:   tanggalOperasional: string;
24:   shift: string;
25:   note: string;
26:   updatedAt: number;
27: }
28: 
29: function getDraftKey(cabangId: string): string {
30:   return DRAFT_PREFIX + cabangId;
31: }
32: 
33: function countFilled(
34:   counts: Record<string, { step1: string; step2: string; keterangan: string; statusIsi?: string; tglRefill?: string; tglPakai?: string }>,
35: ): number {
36:   return Object.keys(counts).reduce((n, k) => {
37:     const v = counts[k];
38:     const hasCount =
39:       String(v?.step1 ?? '').trim() !== '' || String(v?.step2 ?? '').trim() !== '' ||
40:       v?.statusIsi !== undefined || String(v?.tglRefill ?? '').trim() !== '' || String(v?.tglPakai ?? '').trim() !== '';
41:     return n + (hasCount ? 1 : 0);
42:   }, 0);
43: }
44: 
45: function loadDraft(cabangId: string): SODraft | null {
46:   try {
47:     const raw = localStorage.getItem(getDraftKey(cabangId));
48:     if (!raw) return null;
49:     const parsed = JSON.parse(raw) as SODraft;
50:     if (!parsed || typeof parsed !== 'object' || !parsed.counts) return null;
51:     return parsed;
52:   } catch {
53:     return null;
54:   }
55: }
56: 
57: function clearDraft(cabangId: string): void {
58:   try {
59:     localStorage.removeItem(getDraftKey(cabangId));
60:   } catch {
61:     // abai
62:   }
63: }
64: 
65: export default function WelcomeSOPage() {
66:   const router = useRouter();
67:   const { selectedCabang, setSelectedCabang, cabangList, loading: cabangLoading } = useCabang();
68:   const { user } = useAuth();
69:   const [pendingDraft, setPendingDraft] = useState<SODraft | null>(null);
70:   const [isLoading, setIsLoading] = useState(true);
71:   const [showShiftGate, setShowShiftGate] = useState(false);
72: 
73:   useEffect(() => {
74:     if (cabangLoading || !user) return;
75: 
76:     const draftCabangId = selectedCabang?.Cabang_ID || user.cabangId;
77:     if (draftCabangId) {
78:       const cached = loadDraft(draftCabangId);
79:       if (cached && countFilled(cached.counts) > 0) {
80:         setPendingDraft(cached);
81:       }
82:     }
83:     setIsLoading(false);
84:   }, [cabangLoading, user, selectedCabang]);
85: 
86:   const handleLanjutkan = () => {
87:     // Draft is already in localStorage, just navigate to input page
88:     // The input page will automatically load the draft
89:     router.push('/so/input');
90:   };
91: 
92:   const handleMulaiBaru = () => {
93:     // Clear draft and show ShiftCabangGate first
94:     if (selectedCabang?.Cabang_ID) {
95:       clearDraft(selectedCabang.Cabang_ID);
96:     }
97:     setShowShiftGate(true);
98:   };
99: 
100:   const handleGateConfirm = (cabangId: string, shift: string) => {
101:     // Set selected cabang and shift, then navigate to input page
102:     const target = cabangList.find((c) => c.Cabang_ID === cabangId) || null;
103:     if (target) {
104:       setSelectedCabang(target);
105:     }
106:     try {
107:       sessionStorage.setItem('stokis_so_last_shift', shift);
108:     } catch {
109:       // ignore
110:     }
111:     setShowShiftGate(false);
112:     router.push('/so/input');
113:   };
114: 
115:   const handleBatal = () => {
116:     router.back();
117:   };
118: 
119:   // ShiftCabangGate variables
120:   const gateInitialCabangId = selectedCabang?.Cabang_ID ?? null;
121:   const gateInitialShift = (() => {
122:     if (selectedCabang) {
123:       const draft = loadDraft(selectedCabang.Cabang_ID);
124:       if (draft?.shift) return draft.shift;
125:     }
126:     try {
127:       const stored = sessionStorage.getItem('stokis_so_last_shift');
128:       if (stored) return stored;
129:     } catch {
130:       // ignore
131:     }
132:     return 'Opening';
133:   })();
134: 
135:   const getDraftShiftForGate = useCallback((cabangId: string): string | null => {
136:     const draft = loadDraft(cabangId);
137:     return draft?.shift ?? null;
138:   }, []);
139: 
140:   if (isLoading || cabangLoading) {
141:     return (
142:       <div className="min-h-screen bg-base-100 flex items-center justify-center">
143:         <div className="flex flex-col items-center gap-4">
144:           <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
145:           <span className="text-sm text-base-content/60">Memuat...</span>
146:         </div>
147:       </div>
148:     );
149:   }
150: 
151:   return (
152:     <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
153:       <motion.div
154:         initial={{ opacity: 0, scale: 0.95 }}
155:         animate={{ opacity: 1, scale: 1 }}
156:         transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
157:         className="bg-base-100 rounded-xl border border-base-300 shadow-2xl w-full max-w-md"
158:       >
159:         {/* Header */}
160:         <div className="flex items-center justify-between p-5 border-b border-base-300">
161:           <div className="flex items-center gap-3">
162:             {pendingDraft ? (
163:               <div className="p-2 rounded-lg bg-warning/10">
164:                 <AlertTriangle className="w-5 h-5 text-warning" />
165:               </div>
166:             ) : (
167:               <div className="p-2 rounded-lg bg-primary/10">
168:                 <ClipboardCheck className="w-5 h-5 text-primary" />
169:               </div>
170:             )}
171:             <div>
172:               <h1 className="font-semibold text-base-content text-lg">
173:                 {pendingDraft ? 'Sesi Belum Selesai' : 'Stock Opname'}
174:               </h1>
175:               <p className="text-xs text-base-content/60">
176:                 {pendingDraft ? 'Ditemukan data yang belum di-submit' : 'Mulai sesi stock opname baru'}
177:               </p>
178:             </div>
179:           </div>
180:         </div>
181: 
182:         {/* Session Info - only show if draft exists */}
183:         {pendingDraft && (
184:           <div className="p-5 space-y-4">
185:             <div className="grid grid-cols-2 gap-3 text-sm">
186:               <div className="space-y-0.5">
187:                 <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Tanggal</span>
188:                 <p className="font-semibold text-base-content">{pendingDraft.tanggalOperasional || 'Tidak tersedia'}</p>
189:               </div>
190:               <div className="space-y-0.5">
191:                 <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Shift</span>
192:                 <p className="font-semibold text-base-content">{pendingDraft.shift || 'Tidak tersedia'}</p>
193:               </div>
194:               <div className="space-y-0.5">
195:                 <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Progress</span>
196:                 <p className="font-semibold text-base-content">{countFilled(pendingDraft.counts)} item terisi</p>
197:               </div>
198:               {pendingDraft.updatedAt && (
199:                 <div className="space-y-0.5">
200:                   <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Terakhir Diedit</span>
201:                   <p className="font-semibold text-base-content text-xs">
202:                     {new Date(pendingDraft.updatedAt).toLocaleString('id-ID', {
203:                       day: '2-digit',
204:                       month: 'short',
205:                       year: 'numeric',
206:                       hour: '2-digit',
207:                       minute: '2-digit',
208:                     })}
209:                   </p>
210:                 </div>
211:               )}
212:             </div>
213: 
214:             {/* Note preview */}
215:             {pendingDraft.note && (
216:               <div className="bg-base-200/50 rounded-lg p-3">
217:                 <p className="text-xs text-base-content/50 mb-1">Catatan:</p>
218:                 <p className="text-sm text-base-content/80 line-clamp-2">{pendingDraft.note}</p>
219:               </div>
220:             )}
221: 
222:             {/* Storage info */}
223:             <div className="flex items-center gap-2 text-xs text-base-content/40">
224:               <HardDrive className="w-3.5 h-3.5" />
225:               <span>Data tersimpan di penyimpanan sementara browser</span>
226:             </div>
227:           </div>
228:         )}
229: 
230:         {/* Action Buttons */}
231:         <div className="flex flex-col gap-2 p-5 pt-0">
232:           {pendingDraft && (
233:             <button
234:               type="button"
235:               onClick={handleLanjutkan}
236:               className="btn btn-primary min-h-[48px] text-base"
237:             >
238:               <RotateCcw className="w-4 h-4" />
239:               Lanjutkan Sesi Sebelumnya
240:             </button>
241:           )}
242:           <button
243:             type="button"
244:             onClick={handleMulaiBaru}
245:             className="btn btn-ghost min-h-[44px]"
246:           >
247:             <Plus className="w-4 h-4" />
248:             Mulai Sesi Baru
249:           </button>
250:           <button
251:             type="button"
252:             onClick={handleBatal}
253:             className="btn btn-ghost min-h-[44px] text-base-content/60"
254:           >
255:             <ArrowLeft className="w-4 h-4" />
256:             Batal
257:           </button>
258:         </div>
259:       </motion.div>
260: 
261:       {/* ShiftCabangGate - shown when user selects "Mulai Baru" */}
262:       <ShiftCabangGate
263:         open={showShiftGate}
264:         cabangList={cabangList ?? []}
265:         initialCabangId={gateInitialCabangId}
266:         initialShift={gateInitialShift}
267:         getDraftShift={getDraftShiftForGate}
268:         onConfirm={handleGateConfirm}
269:       />
270:     </div>
271:   );
272: }

(End of file - total 272 lines)
</content>
```

---

## Assistant (Plan · Big Pickle · 21.0s)

_Thinking:_

The user asks: "terkait dengan so/input/welcome, ini fungsinya apa?" — "regarding so/input/welcome, what is its function?"

Let me explain clearly what this page does based on the code.

Halaman `/so/input/welcome` adalah **pendahuluan (gate) sebelum masuk ke form Input SO**. Fungsinya:

**Alur utama:**

1. **Cek draft tersimpan** — Saat dimuat, langsung baca localStorage untuk cabang aktif. Kalau ada draft yang sudah diisi sebelumnya → tampilkan info singkatnya (tanggal, shift, berapa item terisi, catatan, kapan terakhir diubah).

2. **Dua pilihan:**
   - **"Lanjutkan Sesi Sebelumnya"** → langsung navigasi ke `/so/input` (form akan auto-restore draft dari localStorage).
   - **"Mulai Sesi Baru"** → hapus draft lama, tampilkan `ShiftCabangGate` (pilih cabang + shift) → navigasi ke `/so/input` dengan kondisi kosong.

3. **Batal** → kembali ke halaman sebelumnya.

**Kapan muncul?**
User menekan tombol "Input SO" dari sidebar/nav → masuk ke halaman welcome ini → baru setelah memilih, masuk ke form isian sebenarnya.

**Ringkasnya:** Welcome page = **intermediari** yang mencegah user langsung terjun ke form tanpa konfirmasi, sekaligus menampilkan "lanjutkan sesi lama atau mulai baru" jika ada draft. Tanpa halaman ini, user langsung masuk form dan tidak tahu ada data tersimpan sebelumnya.

---

## User

oke kemudian di so/input itu ada popup pemilihan cabang dan shift kan? coba highlight codenya

---

## Assistant (Plan · Big Pickle · 6.1s)

_Thinking:_

The user asks to highlight the code for the popup/modal for selecting cabang and shift in `so/input`. Let me read the ShiftCabangGate component fully, and also look at where it's used in the input page.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/bradley/project/stokis-project/components/ShiftCabangGate.tsx"
}
```

**Output:**
```
<path>/home/bradley/project/stokis-project/components/ShiftCabangGate.tsx</path>
<type>file</type>
<content>
1: 'use client';
2: 
3: import React, { useState } from 'react';
4: import { motion, AnimatePresence } from 'framer-motion';
5: import { Store, Clock, ArrowLeft, ChevronRight, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
6: import type { Cabang } from '@/lib/CabangContext';
7: 
8: interface ShiftCabangGateProps {
9:   open: boolean;
10:   cabangList: Cabang[];
11:   initialCabangId: string | null;
12:   initialShift: string;
13:   getDraftShift: (cabangId: string) => string | null;
14:   onConfirm: (cabangId: string, shift: string) => void;
15: }
16: 
17: const SHIFT_OPTIONS = ['Opening', 'Closing'] as const;
18: 
19: export function ShiftCabangGate({
20:   open,
21:   cabangList,
22:   initialCabangId,
23:   initialShift,
24:   getDraftShift,
25:   onConfirm,
26: }: ShiftCabangGateProps) {
27:   const [step, setStep] = useState<'cabang' | 'shift'>('cabang');
28:   const [cabangId, setCabangId] = useState<string | null>(initialCabangId);
29:   const [shift, setShift] = useState<string>(initialShift);
30: 
31:   const selectedCabang = cabangList.find((c) => c.Cabang_ID === cabangId) || null;
32:   const draftShift = cabangId ? getDraftShift(cabangId) : null;
33:   const hasDraftMismatch = !!draftShift && shift !== draftShift;
34: 
35:   const nextDisabled = step === 'cabang' ? !selectedCabang : !shift;
36: 
37:   const handleNext = () => {
38:     if (step === 'cabang' && selectedCabang) {
39:       setStep('shift');
40:     }
41:   };
42: 
43:   const handleConfirm = () => {
44:     if (!selectedCabang || !shift) return;
45:     onConfirm(selectedCabang.Cabang_ID, shift);
46:   };
47: 
48:   return (
49:     <AnimatePresence>
50:       {open && (
51:         <motion.div
52:           initial={{ opacity: 0 }}
53:           animate={{ opacity: 1 }}
54:           exit={{ opacity: 0 }}
55:           className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
56:           role="dialog"
57:           aria-modal="true"
58:           aria-labelledby="gate-title"
59:         >
60:           <motion.div
61:             initial={{ opacity: 0, y: 16, scale: 0.97 }}
62:             animate={{ opacity: 1, y: 0, scale: 1 }}
63:             transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
64:             className="w-full max-w-md card bg-base-100 border border-base-300 shadow-2xl p-6 space-y-5"
65:           >
66:             <div className="flex items-center gap-3">
67:               <div className="p-2 rounded-xl bg-primary/10 text-primary">
68:                 <ShieldCheck className="w-6 h-6" />
69:               </div>
70:               <div className="flex-1">
71:                 <h2 id="gate-title" className="text-base font-bold text-base-content">
72:                   Konfirmasi Input Stock Opname
73:                 </h2>
74:                 <p className="text-xs text-base-content/60">
75:                   Pastikan cabang dan shift sudah benar sebelum mengisi.
76:                 </p>
77:               </div>
78:             </div>
79: 
80:             {/* Step indicator */}
81:             <div className="flex items-center gap-2">
82:               {(['cabang', 'shift'] as const).map((s, i) => (
83:                 <div key={s} className="flex items-center gap-2 flex-1">
84:                   <div
85:                     className={`h-1.5 flex-1 rounded-full transition-colors ${
86:                       (step === s || (step === 'shift' && s === 'cabang'))
87:                         ? 'bg-primary'
88:                         : 'bg-base-200'
89:                     }`}
90:                   />
91:                   <span className={`text-xs font-semibold uppercase tracking-wide ${
92:                     step === s ? 'text-primary' : 'text-base-content/40'
93:                   }`}>
94:                     {i + 1}
95:                   </span>
96:                 </div>
97:               ))}
98:             </div>
99: 
100:             {/* Step 1: Cabang */}
101:             {step === 'cabang' && (
102:               <div className="space-y-3">
103:                 <div className="flex items-center gap-1.5 text-xs font-semibold text-base-content/60">
104:                   <Store className="w-3.5 h-3.5 text-primary" />
105:                   <span>Pilih Cabang</span>
106:                 </div>
107:                 {cabangList.length === 0 ? (
108:                   <p className="text-sm text-base-content/60">
109:                     Tidak ada cabang yang tersedia untuk akun Anda.
110:                   </p>
111:                 ) : (
112:                   <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
113:                     {cabangList.map((c) => {
114:                       const isSelected = c.Cabang_ID === cabangId;
115:                       return (
116:                         <button
117:                           key={c.Cabang_ID}
118:                           type="button"
119:                           onClick={() => setCabangId(c.Cabang_ID)}
120:                           className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
121:                             isSelected
122:                               ? 'border-primary bg-primary/10 ring-1 ring-primary'
123:                               : 'border-base-300 bg-base-100 hover:bg-base-200'
124:                           }`}
125:                         >
126:                           <span className="text-sm font-semibold text-base-content">
127:                             {c.Nama_Cabang}
128:                           </span>
129:                           {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
130:                         </button>
131:                       );
132:                     })}
133:                   </div>
134:                 )}
135:               </div>
136:             )}
137: 
138:             {/* Step 2: Shift */}
139:             {step === 'shift' && selectedCabang && (
140:               <div className="space-y-4">
141:                 <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-base-200/70 border border-base-300">
142:                   <span className="text-xs font-semibold text-base-content/60">Cabang terpilih</span>
143:                   <span className="text-sm font-bold text-base-content">{selectedCabang.Nama_Cabang}</span>
144:                 </div>
145: 
146:                 <div className="flex items-center gap-1.5 text-xs font-semibold text-base-content/60">
147:                   <Clock className="w-3.5 h-3.5 text-primary" />
148:                   <span>Pilih Shift Kerja</span>
149:                 </div>
150:                 <div className="grid grid-cols-2 gap-2">
151:                   {SHIFT_OPTIONS.map((s) => {
152:                     const isSelected = shift === s;
153:                     return (
154:                       <button
155:                         key={s}
156:                         type="button"
157:                         onClick={() => setShift(s)}
158:                         className={`px-4 py-3 rounded-xl border text-center transition-colors ${
159:                           isSelected
160:                             ? 'border-primary bg-primary/10 ring-1 ring-primary'
161:                             : 'border-base-300 bg-base-100 hover:bg-base-200'
162:                         }`}
163:                       >
164:                         <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-base-content'}`}>
165:                           {s}
166:                         </span>
167:                         {isSelected && <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-primary" />}
168:                       </button>
169:                     );
170:                   })}
171:                 </div>
172: 
173:                 {hasDraftMismatch && (
174:                   <motion.div
175:                     initial={{ opacity: 0, height: 0 }}
176:                     animate={{ opacity: 1, height: 'auto' }}
177:                     className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs bg-warning/10 border border-warning/30 text-warning"
178:                     role="alert"
179:                   >
180:                     <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
181:                     <span>
182:                       Ada draft tersimpan untuk shift <strong>{draftShift}</strong> pada cabang ini.
183:                       Draft tersebut tidak akan dipakai dan diabaikan saat submit.
184:                     </span>
185:                   </motion.div>
186:                 )}
187:               </div>
188:             )}
189: 
190:             {/* Footer */}
191:             <div className="flex items-center justify-between gap-3 pt-1">
192:               {step === 'shift' ? (
193:                 <button type="button" onClick={() => setStep('cabang')} className="btn btn-ghost gap-1.5 min-h-[44px]">
194:                   <ArrowLeft className="w-4 h-4" />
195:                   Kembali
196:                 </button>
197:               ) : (
198:                 <span className="text-xs text-base-content/50 px-1">
199:                   Langkah {step === 'cabang' ? '1' : '2'} dari 2
200:                 </span>
201:               )}
202: 
203:               {step === 'cabang' ? (
204:                 <button
205:                   type="button"
206:                   onClick={handleNext}
207:                   disabled={nextDisabled}
208:                   className="btn btn-primary gap-1.5 min-h-[44px]"
209:                 >
210:                   Lanjut
211:                   <ChevronRight className="w-4 h-4" />
212:                 </button>
213:               ) : (
214:                 <button
215:                   type="button"
216:                   onClick={handleConfirm}
217:                   disabled={nextDisabled}
218:                   className="btn btn-primary gap-1.5 min-h-[44px]"
219:                 >
220:                   Mulai Input
221:                   <ShieldCheck className="w-4 h-4" />
222:                 </button>
223:               )}
224:             </div>
225:           </motion.div>
226:         </motion.div>
227:       )}
228:     </AnimatePresence>
229:   );
230: }

(End of file - total 230 lines)
</content>
```

**Tool: grep**

**Input:**
```json
{
  "include": "page.tsx",
  "path": "/home/bradley/project/stokis-project/app/so/input",
  "pattern": "ShiftCabangGate|showShiftGate|setShowShiftGate|handleGateConfirm"
}
```

**Output:**
```
Found 11 matches
/home/bradley/project/stokis-project/app/so/input/welcome/page.tsx:
  Line 16: import { ShiftCabangGate } from '@/components/ShiftCabangGate';

  Line 71:   const [showShiftGate, setShowShiftGate] = useState(false);

  Line 93:     // Clear draft and show ShiftCabangGate first

  Line 97:     setShowShiftGate(true);

  Line 100:   const handleGateConfirm = (cabangId: string, shift: string) => {

  Line 111:     setShowShiftGate(false);

  Line 119:   // ShiftCabangGate variables

  Line 261:       {/* ShiftCabangGate - shown when user selects "Mulai Baru" */}

  Line 262:       <ShiftCabangGate

  Line 263:         open={showShiftGate}

  Line 268:         onConfirm={handleGateConfirm}

```

---

## Assistant (Plan · Big Pickle · 7.9s)

---

