# Architecture

## High-Level System Overview

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser["Browser<br/>(React SPA)"]
    end

    subgraph NextJS["Next.js Server"]
        Pages["Page Routes<br/>(SSR/CSR)"]
        API["API Routes<br/>(27 endpoints)"]
        Middleware["Middleware<br/>(Auth Guard)"]
    end

    subgraph Domain["Domain Layer"]
        SO["SO Service"]
        Laporan["Laporan Service"]
        Dashboard["Dashboard Service"]
        MasterItem["Master Item Service"]
        Cabang["Cabang Service"]
        Petugas["Petugas Service"]
        Users["Users Service"]
    end

    subgraph External["External Services"]
        Sheets["Google Sheets API<br/>(per-branch)"]
        Drive["Google Drive API<br/>(XLSX storage)"]
        GAS["Google Apps Script<br/>(legacy proxy)"]
    end

    Browser --> Pages
    Pages --> API
    API --> Middleware
    Middleware --> SO
    Middleware --> Laporan
    Middleware --> Dashboard
    Middleware --> MasterItem
    Middleware --> Cabang
    Middleware --> Petugas
    Middleware --> Users
    SO --> Sheets
    SO --> Drive
    Laporan --> Sheets
    Laporan --> Drive
    Dashboard --> Sheets
    MasterItem --> Sheets
    Cabang --> Sheets
    Petugas --> Sheets
    Users --> Sheets
    SO -.-> GAS
    Laporan -.-> GAS

    style Client fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style NextJS fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style Domain fill:#FFF3E0,stroke:#E65100,color:#BF360C
    style External fill:#F3E5F5,stroke:#6A1B9A,color:#4A148C
```

## Request Flow

```mermaid
sequenceDiagram
    actor User as User
    participant UI as React UI
    participant API as API Route
    participant Auth as Auth Middleware
    participant Domain as Domain Service
    participant Google as Google APIs

    User->>UI: Action (click/input)
    UI->>API: HTTP Request
    API->>Auth: Validate session cookie
    Auth-->>API: Session valid / invalid
    API->>Domain: Execute business logic
    Domain->>Google: Sheets/Drive API call
    Google-->>Domain: Response data
    Domain-->>API: Processed result
    API-->>UI: JSON response
    UI-->>User: Render update
```

## Authentication Flow

```mermaid
sequenceDiagram
    actor User as User
    participant Login as Login Page
    participant API as /api/auth/login
    participant HMAC as HMAC Session
    participant Cookie as Session Cookie

    User->>Login: Enter username + PIN
    Login->>API: { username, pin }
    API->>API: Verify against Users sheet
    API->>HMAC: Sign session payload
    HMAC->>Cookie: Set HttpOnly cookie
    Cookie-->>User: Session active
    User->>API: Authenticated requests
    API->>HMAC: Verify session signature
```

## Stock Opname Data Flow

```mermaid
flowchart TD
    A["User Input SO"] --> B["Validate Payload"]
    B --> C{"Previous SO exists?"}
    C -->|Yes| D["Fetch Previous SO"]
    C -->|No| E["First SO entry"]
    D --> F["Calculate Status<br/>(Kritis/Hampir Habis/Aman)"]
    E --> F
    F --> G["Save to SO_Transaksi"]
    G --> H["Create Laporan Record"]
    H --> I["Generate XLSX Report"]
    I --> J["Upload to Google Drive"]
    J --> K["Save Drive Link to DB"]
    K --> L["Return Success"]

    style A fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style F fill:#FFF3E0,stroke:#E65100,color:#BF360C
    style I fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style L fill:#F3E5F5,stroke:#6A1B9A,color:#4A148C
```

## Google Sheets Data Model

```mermaid
erDiagram
    REGISTRY_SHEET {
        string Cabang_ID PK
        string Nama_Cabang
        string Spreadsheet_ID
        string Folder_Drive_ID
        boolean Aktif
    }

    USERS_SHEET {
        string User_ID PK
        string Username
        string PIN
        string Nama
        string Role
        string Cabang_ID FK
    }

    MASTER_ITEM {
        string Item_ID PK
        string Nama_Barang
        string Area
        string Satuan
        number Threshold
        string Tipe_Input
    }

    SO_TRANSAKSI {
        string Transaksi_ID PK
        date Tanggal_Operasional
        string Shift
        string Item_ID FK
        number Step1
        number Step2
        number Total
        string Status_Isi
        date Tgl_Refill
        date Tgl_Pakai
        string Note
    }

    LAPORAN_PDF {
        string Laporan_ID PK
        date Tanggal
        string Shift
        string Petugas
        string Link_XLSX
    }

    REGISTRY_SHEET ||--o{ MASTER_ITEM : "per cabang"
    REGISTRY_SHEET ||--o{ SO_TRANSAKSI : "per cabang"
    REGISTRY_SHEET ||--o{ LAPORAN_PDF : "per cabang"
    USERS_SHEET }o--|| REGISTRY_SHEET : "belongs to"
    SO_TRANSAKSI }o--|| MASTER_ITEM : "counts"
```

## XLSX Report Generation

```mermaid
flowchart LR
    A["SO Data"] --> B["ExcelJS Workbook"]
    B --> C["Row 1-3: Headers"]
    B --> D["Row 4-5: Previous SO"]
    B --> E["Row 7-8: Column Headers"]
    B --> F["Row 9+: Data Rows"]
    F --> G["Status Coloring<br/>(KRITIS=Red, AMAN=Green)"]
    F --> H["Pemakaian Calc<br/>(+/- signed)"]
    F --> M["Note Box<br/>(selective, bottom)"]
    B --> I["Freeze Panes<br/>(Col A-B, Row 1-8)"]
    I --> J["Buffer Output"]
    J --> K["Upload to Drive"]
    K --> L["Save WebViewLink"]

    style A fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style B fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style G fill:#FFF3E0,stroke:#E65100,color:#BF360C
    style L fill:#F3E5F5,stroke:#6A1B9A,color:#4A148C
```

## Branch Isolation Model

```mermaid
graph TB
    subgraph Registry["Registry Spreadsheet"]
        DC["Daftar_Cabang"]
        U["Users"]
        SG["Settings_Global"]
        TR["Template_Referensi"]
    end

    subgraph Branch1["Branch: CBG001"]
        MI1["Master_Item"]
        SO1["SO_Transaksi"]
        LP1["Laporan_PDF"]
        PT1["Petugas"]
    end

    subgraph Branch2["Branch: CBG023"]
        MI2["Master_Item"]
        SO2["SO_Transaksi"]
        LP2["Laporan_PDF"]
        PT2["Petugas"]
    end

    DC -->|Spreadsheet_ID| MI1
    DC -->|Spreadsheet_ID| MI2
    DC -->|Folder_Drive_ID| Drive1["Drive Folder CBG001"]
    DC -->|Folder_Drive_ID| Drive2["Drive Folder CBG023"]

    style Registry fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style Branch1 fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style Branch2 fill:#FFF3E0,stroke:#E65100,color:#BF360C
```

## Component Architecture

```mermaid
graph TB
    subgraph Layout["Root Layout"]
        Auth["AuthProvider"]
        Cabang["CabangProvider"]
        Lang["LanguageProvider"]
        Guard["AuthGuard"]
        Tour["TourProvider"]
    end

    subgraph Pages["Page Components"]
        Home["/ (Home)"]
        Login["/login"]
        SOInput["/so/input"]
        SOConfirm["/so/konfirmasi"]
        Laporan["/laporan"]
        Dashboard["/dashboard/*"]
        MasterItem["/master-item"]
        CabangPage["/cabang"]
        Petugas["/petugas"]
        Docs["/docs/*"]
    end

    subgraph Shared["Shared Components"]
        Navbar["Navbar"]
        Loader["QuantumLoader"]
        WAModal["WATemplateModal"]
        Transition["PageTransition"]
        Onboarding["OnboardingTour"]
    end

    Auth --> Guard
    Guard --> Pages
    Navbar --> Layout
    Pages --> Shared

    style Layout fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style Pages fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style Shared fill:#FFF3E0,stroke:#E65100,color:#BF360C
```
