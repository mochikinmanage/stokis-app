// app/api/debug/route.ts
// Debug endpoint — cek data registry cabang (hapus setelah selesai debug)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { resolveCabang } from '@/lib/google/registry';

export const GET = withAuth(async (req: NextRequest, _ctx, _session) => {
  const cabangId = req.nextUrl?.searchParams.get('cabang') || '';
  if (!cabangId) {
    return NextResponse.json({ error: 'cabang param required' }, { status: 400 });
  }
  try {
    const { spreadsheetId, folderId, cabang } = await resolveCabang(cabangId);
    return NextResponse.json({
      cabangId,
      namaCabang: cabang['Nama_Cabang'],
      spreadsheetId,
      folderId,
      folderDriveId_raw: cabang['Folder_Drive_ID'],
      allKeys: Object.keys(cabang),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
});
