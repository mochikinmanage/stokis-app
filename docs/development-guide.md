# Development Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Google Cloud Project** with Service Account
- **Google Sheets** + **Google Drive** API enabled

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/myGroomy/stokis.git
cd stokis
npm install
```

### 2. Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g., `stokis-backend`)
3. Enable APIs:
   - [Google Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com)
   - [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)
4. Create Service Account at [IAM > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
5. Generate JSON key → download the file
6. Note the Service Account email (e.g., `stokis-service@project.iam.gserviceaccount.com`)

### 3. Create Registry Spreadsheet

Create a Google Sheet with these sheets:

| Sheet Name | Columns |
|------------|---------|
| `Daftar_Cabang` | Cabang_ID, Nama_Cabang, Alamat, Spreadsheet_ID, Folder_Drive_ID, PIC_Nama, Nomor_WA_Cabang, Aktif, Created_At |
| `Users` | User_ID, Username, PIN, Nama, Role, Cabang_ID, Aktif, Created_At |
| `Settings_Global` | Key, Value |
| `Template_Referensi` | Kolom A baris 2: Template_Spreadsheet_ID |

### 4. Share Resources

Share **all** spreadsheets and Drive folders with the Service Account email as **Editor**.

### 5. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
STOKIS_API_KEY=stk_your_random_key_min_32_chars
GOOGLE_SERVICE_ACCOUNT_EMAIL=stokis-service@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
REGISTRY_SPREADSHEET_ID=your_spreadsheet_id
```

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Node.js test runner) |

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.3.3 | React framework (App Router) |
| `react` | 19.2.8 | UI library |
| `tailwindcss` | 4.x | Utility-first CSS |
| `daisyui` | 5.7.22 | Tailwind component library |
| `exceljs` | 4.4.0 | XLSX report generation |
| `googleapis` | 176.0.0 | Google Sheets + Drive API |
| `recharts` | 2.15.3 | Dashboard charts |
| `framer-motion` | 11.18.2 | Page transitions |
| `lucide-react` | 1.34.0 | Icon library |

## Coding Conventions

### TypeScript

- Strict mode enabled
- Use `interface` for object shapes, `type` for unions/aliases
- Prefix internal types with `I` (e.g., `IXlsxItem`)
- Use `unknown` over `any`

### React

- Functional components only
- Use `"use client"` directive for client components
- Prefer Server Components when no interactivity needed
- Use React Context for shared state (Auth, Cabang, Language)

### Styling

- Tailwind CSS utilities first
- Use DaisyUI component classes (`btn`, `card`, `badge`, etc.)
- Responsive: `sm:` → `md:` → `lg:` → `xl:` breakpoints
- Dark mode via `dark:` variant (when enabled)

### API Routes

- Always validate input before processing
- Use domain services from `lib/domain/`
- Return consistent JSON: `{ success: boolean, data?, error? }`
- Handle errors with `ApiError` class

### Testing

- Unit tests in `test/` directory
- Run with `npm test` (Node.js built-in test runner)
- Test file naming: `*.test.js`

## Common Tasks

### Adding a New API Endpoint

1. Create route file: `app/api/your-endpoint/route.ts`
2. Export named functions: `GET`, `POST`, `PUT`, `DELETE`
3. Add domain logic in `lib/domain/your-service.ts`
4. Add Google Sheets helpers in `lib/google/sheets.ts` if needed

### Adding a New Page

1. Create page file: `app/your-page/page.tsx`
2. Add navigation link in `components/Navbar.tsx`
3. Use `"use client"` if page needs interactivity
4. Wrap with `AuthGuard` if authentication required

### Modifying XLSX Report

1. Edit `lib/domain/xlsx-report.ts`
2. Column definitions at line ~148
3. Data row generation at line ~170
4. Test by submitting an SO and checking the generated file

### Adding a New Master Item Field

1. Update `lib/domain/master-item-service.ts` (read/write)
2. Update `app/master-item/page.tsx` (form + table)
3. Update `apps-script/MasterItem.js` (GAS compatibility)
4. Add column to Google Sheet schema
