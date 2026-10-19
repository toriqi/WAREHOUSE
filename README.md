# VOTP Request Material Web App

Aplikasi web enterprise full-stack untuk mengelola proses request spare part dari User melalui **ASS/COP**, **Warehouse (WHS)**, dan **Warranty Team (NGC)** secara terintegrasi dengan perhitungan SLA Lead Time otomatis, pembuatan **Case Open**, alur **Cancel & Revisi DO/TO**, analisis **Warranty NGC** secara paralel, **Audit Trail**, serta ekspor transaksi **CSV & XLSX**.

---

## 1. Struktur Folder Proyek

```text
votp-request-material-app/
├── netlify/
│   └── functions/
│       └── health-and-sla-check.ts        # Serverless function untuk operasi server-side aman
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql         # Tabel relasional, constraint, index, trigger SLA & Case Open
│       ├── 002_rls_and_storage_policies.sql # Kebijakan Row Level Security (RLS) & Storage Bucket
│       └── 003_seed_data.sql              # Seed konfigurasi awal aplikasi (app_settings)
├── src/
│   ├── lib/
│   │   ├── supabase.ts                    # Inisialisasi Supabase client (Anon Key + RLS)
│   │   └── votpIntegration.ts             # Adapter validasi Link VOTP & stub integrasi eksternal
│   ├── App.tsx                            # Aplikasi utama (Auth, RBAC, Dashboard, Workflow, KPI, Settings)
│   └── main.tsx                           # Entry point React + Vite
├── .env.example                           # Template environment variables
├── index.html                             # HTML root entry
├── netlify.toml                           # Konfigurasi build, SPA redirect, & security headers Netlify
├── package.json                           # Dependensi React, TypeScript, Tailwind, Lucide, Supabase
├── tailwind.config.js                     # Konfigurasi Tailwind CSS
├── tsconfig.json                          # Konfigurasi TypeScript
└── vite.config.ts                         # Konfigurasi bundler Vite
```

---

## 2. Arsitektur Role & Hak Akses (Tanpa Role Admin Terpisah)

Sesuai spesifikasi sistem, **hanya terdapat 3 role aplikasi**:

| Fitur / Modul | `ASS_COP` (Owner Proses & Settings) | `WHS` (Warehouse Operations) | `NGC` (Warranty Team) |
| :--- | :---: | :---: | :---: |
| Melihat Dashboard sesuai Role | Ya (Keseluruhan) | Ya (Operasional Gudang) | Ya (Antrean Warranty) |
| Membuat Draft, Process & Send Request ke WHS | Ya | Tidak | Tidak |
| Mencatat Link VOTP, WO/PO terpisah, DO, TO, Warranty Note | Ya | Baca Saja | Baca Saja (Khusus Warranty) |
| Update Status Gudang (`COLLECT` → `READY` → `RECEIVED`) | Pantau Real-time | Ya | Tidak |
| Tombol `CANCEL` dengan Alasan Wajib | Terima Notifikasi & Evaluasi | Ya | Tidak |
| Revisi Request & Pembaruan DO/TO (Riwayat Tersimpan) | Ya | Lihat Riwayat | Tidak |
| Mengisi Root Cause & Corrective Action pada `Case Open` | Verifikasi & Close Case | Ya | Tidak |
| Analisis Klaim Warranty (`APPROVED` / `REJECTED` + Bukti) | Pantau & Tindak Lanjut GI/WO | Tidak | Ya |
| Ekspor Transaksi (`CSV` & `XLSX`) | Ya | Sesuai Hak Akses | Sesuai Hak Akses |
| Mengakses Menu `Settings` (Branding, SLA, Cancel, Export) | **Ya (Eksklusif)** | **Ditolak (UI & RLS)** | **Ditolak (UI & RLS)** |

---

## 3. Panduan Instalasi Lokal

1. **Prasyarat**: Node.js `>= 20.x` dan npm.
2. **Instalasi dependensi**:
   ```bash
   npm install
   ```
3. **Konfigurasi Environment Variables**:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi nilai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari proyek Supabase Anda.
4. **Menjalankan server pengembangan**:
   ```bash
   npm run dev
   ```
5. **Membuat production build**:
   ```bash
   npm run build
   ```

---

## 4. Setup Database, Auth, RLS, dan Storage di Supabase

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka menu **SQL Editor**, lalu jalankan file migrasi secara berurutan:
   - `supabase/migrations/001_initial_schema.sql` (Membuat 9 tabel inti: `profiles`, `app_settings`, `requests`, `request_revisions`, `warehouse_events`, `warehouse_cases`, `warranty_analyses`, `notifications`, `audit_logs`, beserta trigger perhitungan otomatis `Lead Time = ready_at - sent_to_whs_at` dan pembuatan `Case Open` otomatis ketika `actual_minutes > target_minutes_snapshot`).
   - `supabase/migrations/002_rls_and_storage_policies.sql` (Mengaktifkan RLS pada seluruh tabel dan membuat bucket Storage `branding` serta `warranty-evidence`).
   - `supabase/migrations/003_seed_data.sql` (Mengisi konfigurasi awal `app_settings`).
3. **Provisioning Pengguna & Role (Onboarding Aman)**:
   - Buka **Authentication → Users** di Supabase Dashboard dan tambahkan user untuk masing-masing role (`ASS_COP`, `WHS`, `NGC`).
   - Tetapkan role pengguna di tabel `public.profiles` menggunakan SQL Editor (pengguna baru tidak diizinkan memilih role privileged sendiri dari client):
     ```sql
     INSERT INTO public.profiles (id, full_name, email, role, unit_assignment, is_active)
     VALUES
       ('<UUID_USER_ASS_COP>', 'Budi Santoso (ASS/COP)', 'ass.cop@company.co.id', 'ASS_COP', 'HO-PLANT-01', TRUE),
       ('<UUID_USER_WHS>', 'Andi Pratama (WHS)', 'whs.ops@company.co.id', 'WHS', 'WHS-CENTRAL', TRUE),
       ('<UUID_USER_NGC>', 'Siti Rahma (NGC)', 'ngc.warranty@company.co.id', 'NGC', 'NGC-WARRANTY', TRUE);
     ```

---

## 5. Panduan Deployment ke Netlify

1. **Hubungkan Git Repository**:
   - Push kode proyek ke repository GitHub / GitLab / Bitbucket.
   - Login ke Netlify Dashboard → pilih **Add new site → Import an existing project**.
2. **Konfigurasi Build (Otomatis terbaca dari `netlify.toml`)**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
3. **Environment Variables di Netlify**:
   Buka **Site configuration → Environment variables**, lalu tambahkan:
   - `VITE_SUPABASE_URL`: URL project Supabase Anda.
   - `VITE_SUPABASE_ANON_KEY`: Anon/publishable key Supabase Anda (aman untuk client karena RLS aktif).
   - `SUPABASE_SERVICE_ROLE_KEY`: *(Opsional, khusus Netlify Functions server-side — JANGAN pernah diawali dengan `VITE_`)*.
4. **Deploy Preview & Production**:
   - Setiap Pull Request akan otomatis membuat **Deploy Preview** untuk pengujian UAT.
   - Merge ke branch utama (`main`) akan men-trigger **Production Deploy**.
5. **Custom Domain & HTTPS**:
   - Buka **Domain management → Add a domain**, arahkan CNAME ke `<site-name>.netlify.app`, dan aktifkan sertifikat SSL/TLS Let's Encrypt otomatis.

---

## 6. Status Implementasi Fitur vs. Integrasi Eksternal

### Fitur yang Sudah Selesai & Berfungsi Penuh
- Autentikasi login/logout, validasi form, show/hide password, reset password, serta proteksi halaman internal berbasis role (`ASS_COP`, `WHS`, `NGC`).
- Manajemen Branding & Settings khusus `ASS_COP` (upload/ganti/reset logo dengan validasi tipe & ukuran, ubah nama aplikasi, subtitle, warna utama, target SLA lead time, daftar alasan cancel, dan konfigurasi ekspor) lengkap dengan pencatatan nilai lama & baru di Audit Log.
- Form Request `ASS/COP` dengan Request ID otomatis & unik, validasi Link VOTP, pemisahan field Nomor WO dan Nomor PO, pencegahan duplikasi referensi VOTP, status `DRAFT`, `PROCESSED`, dan `SENT_TO_WHS`.
- Paket Informasi Antrean `WHS` lengkap dengan tombol Open VOTP, Copy Reference, badge `NORMAL`/`WARRANTY`, riwayat revisi, serta **Layout Cetak A4** khusus lapangan (`@media print` menyembunyikan sidebar/navbar/tombol aksi).
- Workflow Warehouse (`SENT_TO_WHS` → `COLLECT` → `READY` → `RECEIVED`) dengan validasi transisi status ketat dan pencatatan timestamp per tahap.
- Kalkulasi otomatis `Lead Time = ready_at - sent_to_whs_at`, penyimpanan `target_lead_time_snapshot` saat request dikirim, serta pembuatan otomatis **Case Open** jika durasi melampaui target tanpa duplikasi per percobaan revisi.
- Pengisian Root Cause & Corrective Action oleh `WHS` dan verifikasi/penutupan `Case Open` oleh `ASS/COP` (wajib mengisi catatan penyelesaian).
- Fitur `CANCEL` oleh `WHS` dengan modal konfirmasi dan alasan wajib (termasuk validasi wajib catatan tambahan saat memilih *Lainnya*), otomatis mengubah status ke `CANCELLED_BY_WHS`, membuat task `ACTION_REQUIRED_ASS`, dan mengirim notifikasi ke `ASS/COP`.
- Modul Revisi `ASS/COP` yang menyimpan nomor revisi, alasan revisi, DO/TO sebelum & sesudah revisi, pembuat revisi, dan riwayat percobaan pengambilan sebelumnya secara terpisah.
- Workflow paralel **Warranty NGC** (`WARRANTY_PENDING`, `WARRANTY_APPROVED`, `WARRANTY_REJECTED`) yang terpisah dari status Warehouse, lengkap dengan lampiran bukti, alasan wajib saat `REJECTED`, notifikasi ke `ASS/COP`, dan pencatatan tindak lanjut WO baru / GI oleh `ASS/COP`.
- Ekspor data transaksi ke **CSV** dan **XLSX** sesuai filter aktif dan hak akses tanpa menyertakan data rahasia sistem.

### Fitur yang Membutuhkan Kredensial / Integrasi Eksternal
- **Koneksi Supabase Cloud Live**: Siap dihubungkan begitu `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dimasukkan pada environment atau melalui panel konfigurasi koneksi di aplikasi.
- **Auto-Parsing Isi PDF dari URL VOTP**: Saat ini menggunakan penyimpanan URL referensi tervalidasi (`src/lib/votpIntegration.ts`). Ekstraksi otomatis dokumen PDF VOTP memerlukan akses API/jaringan internal perusahaan.
- **Otomatisasi Transaksi SAP (Cancel/Create DO & TO Otomatis)**: Pembatalan dan pembuatan ulang DO/TO dilakukan sesuai SOP oleh `ASS/COP` dan dicatat di sistem; eksekusi BAPI/RFC langsung ke SAP ERP belum diaktifkan sampai otorisasi kredensial SAP tersedia.
- **Pengiriman Email Eksternal (SMTP/Resend)**: Notifikasi in-app berjalan penuh; pengiriman email keluar memerlukan konfigurasi SMTP/API key pada Netlify Functions.
EOF
