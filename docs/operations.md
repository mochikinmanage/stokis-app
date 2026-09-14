# Operations

## Deployment

### Vercel (Recommended)

Stokis is a Next.js application optimized for Vercel's serverless deployment.

#### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your GitHub/GitLab repository
4. Framework: **Next.js** (auto-detected)

#### 2. Configure Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `STOKIS_API_KEY` | `stk_...` | Min 32 characters, random string |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `stokis-service@...iam.gserviceaccount.com` | From GCP Console |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n..."` | Escape `\n` properly |
| `REGISTRY_SPREADSHEET_ID` | `1aBcDeFg...` | From Google Sheet URL |
| `APP_URL` | `https://yourapp.vercel.app` | Optional, for XLSX fallback links |

#### 3. Deploy

Click **Deploy**. Build takes ~1-2 minutes.

#### 4. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain
3. Configure DNS as instructed

### Docker (Self-Hosted)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t stokis .
docker run -p 3000:3000 --env-file .env.local stokis
```

## Security Headers

Configured in `next.config.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable sensitive APIs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |
| `Content-Security-Policy` | Restrictive policy | Control resource loading |

## Monitoring

### Health Check

```bash
curl https://yourapp.vercel.app/api/health
```

### Debug Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/debug/env` | Check environment variable status |
| `GET /api/debug/sheets` | Test Google Sheets connectivity |
| `GET /api/debug/gas-url` | Test Apps Script URL |
| `GET /api/debug/registry` | Check registry spreadsheet structure |

### Error Tracking

- API errors return `{ success: false, error: { code, message } }`
- Google API errors are caught and normalized in `lib/google/`
- Session errors redirect to `/login`

## Database Management

### Google Sheets Structure

Each branch has its own spreadsheet with these sheets:

| Sheet | Purpose |
|-------|---------|
| `Master_Item` | Item definitions (name, unit, threshold, area, `Tipe_Input`) |
| `SO_Transaksi` | Stock opname transaction records |
| `Laporan_PDF` | Laporan records + XLSX links |
| `Petugas` | Staff data |

#### `Master_Item` — kolom

| Kolom | Keterangan |
|-------|-----------|
| `Tipe_Input` | Jenis input per item: `single` / `dual` / `boolean` / `date` (comma-separated utk kombinasi, mis. `boolean,date`). Kosong = `dual`. |

#### `SO_Transaksi` — kolom

| Kolom | Keterangan |
|-------|-----------|
| `Status_Isi` | Untuk item `boolean`: `Isi` / `Kosong` |
| `Tgl_Refill` | Untuk item `date`: tanggal refill (YYYY-MM-DD) |
| `Tgl_Pakai` | Untuk item `date`: tanggal pakai (YYYY-MM-DD) |
| `Note` | Catatan laporan per sesi (opsional, diulang di setiap baris transaksi sesi tsb) |

#### Catatan pada XLSX report

- Item bertipe `boolean`/`date` tidak menampilkan masukan numerik (Step1/Step2) di form.
- Kolom `Keterangan Sebelumnya` tidak lagi dicetak di laporan.
- `Note` dicetak sebagai box besar di bagian paling bawah laporan (hanya bila terisi).

### Registry Spreadsheet

| Sheet | Purpose |
|-------|---------|
| `Daftar_Cabang` | Branch list + spreadsheet/folder IDs |
| `Users` | User accounts + PIN |
| `Settings_Global` | Global configuration |
| `Template_Referensi` | Template spreadsheet ID for cloning |

### Adding a New Branch

1. Copy the template spreadsheet
2. Create a Drive folder for the branch
3. Add a row to `Daftar_Cabang` with:
   - `Cabang_ID`: Unique ID (e.g., `CBG003`)
   - `Nama_Cabang`: Branch name
   - `Spreadsheet_ID`: ID from the new spreadsheet URL
   - `Folder_Drive_ID`: ID from the Drive folder URL
4. Share both spreadsheet and folder with the Service Account

### Backup Strategy

- Google Sheets has built-in version history
- Export critical data periodically via XLSX
- Registry spreadsheet is the single source of truth — back it up first

## Performance

### Caching

- Static pages are pre-rendered at build time
- API routes are serverless functions (cold start ~200ms)
- Google Sheets API responses are not cached (real-time data)

### Optimization

- Images: Use `next/image` for optimization
- Fonts: Self-hosted via `next/font`
- Bundle: Tree-shaking enabled by default in Next.js
- CSS: Tailwind v4 with automatic purging

### Limits

| Resource | Limit |
|----------|-------|
| Vercel serverless timeout | 10s (Hobby), 60s (Pro) |
| Google Sheets API quota | 300 requests/minute per project |
| Google Drive API quota | 12,000 requests/minute per project |
| XLSX file size | ~5MB typical (depends on item count) |
