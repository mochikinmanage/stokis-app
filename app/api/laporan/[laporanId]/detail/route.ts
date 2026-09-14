// app/api/laporan/[laporanId]/detail/route.ts
// GET: detail item laporan dari Laporan_SO, di-enrich dengan Tipe_Input dari
// Master_Item (Laporan_SO tidak menyimpan Tipe_Input). Dipakai halaman edit.
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, assertCabangAccess } from '@/lib/auth';
import { ApiError } from '@/lib/domain/errors';
import { getLaporanDetail } from '@/lib/domain/laporan-service';
import { getMasterItems } from '@/lib/domain/master-item-service';

export const GET = withAuth(async (req: NextRequest, { params }, session) => {
  const { laporanId } = await params;
  const cabangId = req.nextUrl.searchParams.get('cabang') || '';

  if (!cabangId) {
    return NextResponse.json(
      { success: false, error: { code: 'CABANG_REQUIRED', message: 'Parameter cabang wajib disertakan' } },
      { status: 400 }
    );
  }

  const guard = assertCabangAccess(session, cabangId);
  if (guard) return guard;

  try {
    const rows = await getLaporanDetail(cabangId, laporanId);
    const masterItems = await getMasterItems(cabangId);
    const tipeInputMap = new Map<string, string>();
    masterItems.forEach((m) =>
      tipeInputMap.set(String((m as Record<string, unknown>)['Item_ID'] || ''), String((m as Record<string, unknown>)['Tipe_Input'] || ''))
    );

    const data = rows.map((r) => {
      const itemId = String(r['Item_ID'] || '');
      return {
        Item_ID: itemId,
        Nama_Barang: String(r['Nama_Barang'] || ''),
        Area: String(r['Area'] || ''),
        Satuan: String(r['Satuan'] || ''),
        Threshold: r['Threshold'] != null && r['Threshold'] !== '' ? Number(r['Threshold']) : null,
        Step1: Number(r['Step1']) || 0,
        Step2: Number(r['Step2']) || 0,
        Keterangan: String(r['Keterangan'] || ''),
        Tipe_Input: tipeInputMap.get(itemId) || '',
        Status_Isi: String(r['Status_Isi'] || ''),
        Tgl_Refill: String(r['Tgl_Refill'] || ''),
        Tgl_Pakai: String(r['Tgl_Pakai'] || ''),
        Tgl_Kedaluwarsa: String(r['Tgl_Kedaluwarsa'] || ''),
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const apiErr = err instanceof ApiError ? err : new ApiError('internal_error', err instanceof Error ? err.message : 'Terjadi kesalahan');
    return NextResponse.json(
      { success: false, error: { code: apiErr.code, message: apiErr.message } },
      { status: 400 }
    );
  }
});