# Undian Digital Hari Guru 2026

Aplikasi undian doorprize digital untuk peringatan Hari Guru 25 November 2026 tingkat kecamatan.

> Status: **Fase 6 selesai** — seluruh alur undian digital siap dipakai: pendaftaran sekolah mandiri, pengelolaan peserta, kartu undian, pengundian aman, layar panggung realtime, rekap hasil, export CSV, dan panduan deploy produksi di [DEPLOY.md](./DEPLOY.md).

## Stack

- **Web:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Realtime:** Socket.io (web + server terpisah, event `undian:update`)
- **Import/export:** `read-excel-file` + `write-excel-file` untuk `.xlsx`, `csv-parse` untuk `.csv`
- **Database:** PostgreSQL (Supabase/Railway/Neon)
- **Auth:** JWT HttpOnly cookie, password bcrypt
- **Monorepo:** npm workspaces

## Struktur

```text
apps/
  web/                  Next.js App Router
    public/             aset publik, termasuk logo-pgri.png
    src/app/            halaman & API route
    src/components/     komponen UI
    src/lib/            JWT, session, database client, kartu
    src/middleware.ts   proteksi route berbasis role
  ws-server/            Express + Socket.io + endpoint event internal
packages/
  db/
    migrations/         SQL migration PostgreSQL
    scripts/            migrate, seed, test schema
    src/                pg pool & query helper
```

## Prasyarat

- Node.js >= 20.9
- PostgreSQL 13+ (lokal atau cloud)

## Menjalankan lokal

1. Salin environment:

   ```bash
   cp .env.example .env
   ```

2. Isi minimal:

   ```dotenv
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hari_guru
   JWT_SECRET=gunakan-secret-acak-minimal-32-karakter
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=password-admin-anda
   OPERATOR_USERNAME=operator
   OPERATOR_PASSWORD=password-operator-anda
   WS_INTERNAL_SECRET=secret-internal-acak
   ```

   `JWT_SECRET` dapat dibuat dengan:

   ```bash
   openssl rand -base64 48
   ```

   Variabel penting lainnya: `WS_URL` dan `NEXT_PUBLIC_WS_URL` (alamat WS server),
   `WS_INTERNAL_SECRET` (secret web ↔ WS), `CORS_ORIGIN` (origin web yang diizinkan),
   serta `DATABASE_POOL_MAX`. Tabel lengkap ada di [DEPLOY.md](./DEPLOY.md#2-variabel-environment).

3. Install dependency:

   ```bash
   npm install
   ```

4. Jalankan migrasi dan seed:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   Seed membuat akun admin dan operator. Jika `SEED_SCHOOL_USERNAME` diisi, satu akun sekolah contoh juga dibuat.

5. Jalankan web:

   ```bash
   npm run dev:web
   ```

   Buka `http://localhost:3000`.

6. Opsional untuk pengembangan, jalankan WS server di terminal terpisah:

   ```bash
   npm run dev:ws
   ```

   Health check: `http://localhost:4000/health`. Untuk acara, jalankan web dan WS server bersamaan. `NEXT_PUBLIC_WS_URL` dibaca saat build, jadi atur nilainya sebelum `npm run build`.

## Akun & halaman

| Role | Login | Halaman |
| --- | --- | --- |
| Sekolah | `/login-sekolah` | `/dashboard-sekolah` |
| Admin kecamatan | `/login-admin` | `/admin` |
| Operator | `/login-admin` | `/operator` |
| Publik | — | `/daftar-sekolah`, `/kartu`, `/kartu/[nomor_undian]`, `/layar`, `/live`, `/hasil` |

- `/operator` hanya dapat diakses role `operator`.
- `/admin` hanya dapat diakses role `admin`.
- `/dashboard-sekolah` hanya dapat diakses role `sekolah`.
- `/daftar-sekolah`, `/kartu`, `/layar`, `/live`, dan `/hasil` bersifat publik tanpa login.
- Semua pengecekan role dilakukan di middleware dan dicek kembali di server component.

## Fitur Fase 6 — Pendaftaran sekolah mandiri

- Halaman publik `/daftar-sekolah` untuk membuat akun sekolah tanpa menunggu panitia.
- Akun langsung aktif dan otomatis login setelah pendaftaran, lalu diarahkan ke dashboard sekolah.
- Validasi sama dengan pembuatan akun oleh admin: nama sekolah, username, dan password.
- Nama sekolah diverifikasi tanpa membedakan huruf besar/kecil serta mengabaikan spasi berlebih. Duplikat ditolak dengan pesan yang jelas.
- Unique index database `sekolah_nama_normal_unik` menjadi pengaman terakhir terhadap pendaftaran bersamaan.
- Admin dapat mereset password sekolah dari tabel **Data sekolah** di `/admin`.
- Rate limit in-memory: login maksimal 10 percobaan per 5 menit per IP, pendaftaran maksimal 5 per jam per IP. Respons `429` menyertakan header `Retry-After`.

## Perbaikan tampilan terbaru

- Navigasi publik (Home, Layar, Live, Hasil, Kartu) ditempatkan di bagian atas setiap halaman publik.
- Beranda tidak lagi memakai footer terpisah; keterangan panitia ditampilkan di bawah tautan pendaftaran sekolah.
- Tata letak responsif diuji pada lebar 320–768 px. Daftar peserta, sekolah, dan pemenang berubah menjadi kartu vertikal di layar HP agar tidak ada bagian yang terpotong atau perlu digeser ke samping.
- Menu beranda menampilkan seluruh tautan navigasi di semua ukuran layar.

## Fitur Fase 5 — Polish & kesiapan acara

- Redirect setelah login menghormati parameter `?next=` yang aman (hanya path internal), sehingga tautan yang dilindungi kembali ke halaman tujuan.
- Halaman error ramah kendala dengan tombol coba lagi dan kembali ke beranda.
- Ikon aplikasi (favicon) memakai logo PGRI.
- `robots.txt` melarang seluruh perayapan mesin pencari.
- Nama peserta/pemenang panjang dibungkus rapi di kartu, layar panggung, dan halaman live.
- Wilayah pemenang pada layar panggung memakai `aria-live` agar pembaca layar mengumumkan pemenang baru.
- Perintah produksi `npm run start:web` dan `npm run start:ws` tersedia di root.
- Panduan lengkap deploy, HTTPS/WSS, environment, checklist hari acara, dan troubleshooting ada di [DEPLOY.md](./DEPLOY.md).

## Fitur Fase 4 — Pengundian live

### Panel operator (`/operator`)

- Daftar sesi hadiah dengan status, target, dan progres pemenang.
- **Mulai sesi** membuka sesi agar tampil di panggung. Hanya satu sesi berjalan pada satu waktu; sesi berjalan sebelumnya otomatis ditutup.
- **Undi sekarang** memilih satu pemenang dari peserta yang belum pernah menang.
- Pemenang langsung tersimpan, terkunci, dan tampil di daftar sesi aktif.
- Tombol undian nonaktif saat target terpenuhi atau sesi selesai.
- Export CSV pemenang per sesi.

### Keamanan pengundian

- Pengacakan memakai Fisher-Yates dengan `crypto.randomInt`, bukan `Math.random()`.
- Seluruh aksi undian diserialkan dengan PostgreSQL advisory lock agar dua operator tidak dapat memilih bersamaan.
- Peserta yang sudah menang otomatis dikecualikan; constraint `pemenang.peserta_id` unik menjadi pengaman terakhir.
- Hanya role `operator` yang dapat membuka sesi dan menjalankan undian.
- Sesi yang selesai atau sudah memenuhi target menolak undian berikutnya.

### Layar panggung (`/layar`) dan live publik (`/live`)

- Menampilkan sesi aktif serta kartu pemenang berisi logo PGRI, nama, dan sekolah dengan ukuran huruf besar. Nomor undian dan peran tidak ditampilkan pada kartu pemenang.
- Daftar pemenang sesi dan progres target.
- Sebelum pemenang resmi ditampilkan, layar menjalankan animasi pengacakan ±4,2 detik lewat event `undian:drawing`, lalu reveal pemenang lewat `undian:update`.
- Diperbarui otomatis lewat Socket.io event `undian:update`.
- Jika koneksi WebSocket terputus, halaman melakukan polling `/api/live` setiap 10 detik sebagai cadangan.
- `/layar` memakai tema panggung gelap; `/live` versi publik yang ramah ponsel.

### Rekap hasil (`/hasil`)

- Menampilkan seluruh sesi dan pemenang resmi beserta waktu menang.
- Bisa diakses publik tanpa login dan bersifat dinamis.

### Export CSV pemenang

- Endpoint `/api/panitia/export/pemenang?sesi=<id>` untuk role `admin` dan `operator`.
- Kolom: sesi, urutan, hadiah ke-, nomor undian, nama, sekolah, peran, waktu menang.
- Tautan CSV tersedia di panel operator dan daftar sesi dashboard admin.

## Fitur Fase 3 — Kartu undian

### Halaman publik

- `/kartu` — pencarian kartu dengan input nomor fleksibel: `KEC-0001`, `kec-1`, `0001`, atau `1`.
- `/kartu/[nomor_undian]` — kartu peserta berisi nama dan sekolah. Nomor undian tetap dipakai pada URL dan pencarian, tetapi tidak ditampilkan pada kartu.
- Tombol **Cetak / Simpan PDF** memakai dialog cetak browser dengan CSS khusus cetak (A4, tanpa header/aksi).
- Tombol **Salin tautan** menyalin URL kartu untuk dibagikan lewat WhatsApp.
- Nomor tidak terdaftar menampilkan halaman 404 yang tetap menyediakan form pencarian.
- Halaman kartu memakai `force-dynamic` agar perubahan nama dari sekolah langsung terlihat.
- `robots: noindex` tetap aktif di seluruh aplikasi.

### Integrasi logo

- Logo PGRI tersedia di `apps/web/public/logo-pgri.png` dan diakses lewat `/logo-pgri.png`.
- Komponen `BrandMark` kini menampilkan logo asli, sehingga otomatis muncul di header publik, halaman login, dashboard sekolah, dashboard admin, dan operator.
- Kartu undian menampilkan logo pada bagian kepala kartu.

### Dari dashboard sekolah

- Setiap peserta yang sudah tersimpan memiliki tautan **Kartu** yang membuka kartu di tab baru.
- Nomor undian tetap ditampilkan pada tabel dan tidak berubah saat data diedit.

## Fitur Fase 2

### Dashboard sekolah (`/dashboard-sekolah`)

- Tambah, ubah, dan hapus baris peserta secara dinamis (kepala sekolah/guru).
- Simpan daftar sekaligus; validasi nama dan peran dilakukan di server.
- Nomor undian `KEC-XXXX` dibuat otomatis dan tidak berubah saat nama diedit.
- Import `.xlsx`/`.csv` yang **menambahkan** peserta baru (bukan mengganti data lama).
  - Batas 2 MB dan 1000 baris per import.
  - Header wajib `NAMA` dan `PERAN`; alias `name`/`role` juga diterima.
  - Peran menerima `guru`, `kepsek`, `kepala sekolah`, dan variasi huruf besar/kecil.
  - CSV mendukung pemisah koma maupun titik koma.
- Download template Excel berisi sheet `Peserta` dan `Petunjuk`.
- Peserta yang sudah memiliki riwayat menang tidak dapat dihapus.

### Dashboard admin (`/admin`)

- Statistik nyata: jumlah sekolah, peserta, sesi hadiah, dan pemenang.
- Membuat akun sekolah (nama sekolah, username, password awal).
- Monitoring jumlah kepala sekolah/guru per sekolah dan daftar peserta per sekolah.
- Export CSV seluruh peserta atau per sekolah.
- Membuat dan menghapus sesi hadiah (urutan, nama hadiah, target pemenang).
- Sesi yang sedang berjalan atau sudah memiliki pemenang tidak dapat dihapus.

### Aturan nomor undian

- Nomor dialokasikan dari sequence PostgreSQL `nomor_undian_seq` agar aman terhadap proses bersamaan.
- Format `KEC-0001`, `KEC-0002`, dan seterusnya; nomor tidak pernah dipakai ulang.
- Nomor bersifat tetap sepanjang peserta masih terdaftar.

## Perintah

```bash
npm run dev:web       # Next.js dev server
npm run dev:ws        # Socket.io server (development)
npm run build         # build db, web, ws-server
npm run start:web     # jalankan Next.js hasil build (produksi)
npm run start:ws      # jalankan Socket.io hasil build (produksi)
npm run typecheck     # build db lalu typecheck semua workspace
npm test              # uji migrasi & constraint pada PostgreSQL (PGlite)
npm run db:migrate    # terapkan migration
npm run db:seed       # seed admin, operator, dan sekolah opsional
```

## Deploy produksi

Panduan rinci tersedia di **[DEPLOY.md](./DEPLOY.md)**. Ringkasnya:

1. Siapkan PostgreSQL, Node.js >= 20.9, dan HTTPS.
2. Isi `.env` dari `.env.example`; `NEXT_PUBLIC_WS_URL` harus sudah benar **sebelum build**.
3. `npm ci && npm run build`.
4. `npm run db:migrate && npm run db:seed`.
5. Jalankan `npm run start:web` dan `npm run start:ws` di bawah process manager.
6. Arahkan reverse proxy ke port web (`3000`) dan WS (`4000`), aktifkan upgrade WebSocket.
7. Cek `/api/health` (web) dan `/health` (WS).

Checklist hari acara dan troubleshooting ada di DEPLOY.md bagian 7–9.

## Skema database

Tabel dibuat di `packages/db/migrations/001_init.sql`, ditambah migration
`002_sekolah_nama_unik.sql`:

- `sekolah`
- `peserta` (nomor undian `KEC-XXXX`, enum peran `kepsek`/`guru`)
- `sesi_hadiah`
- `pemenang`
- `admin_kecamatan`
- `nomor_undian_seq` untuk alokasi nomor aman terhadap proses bersamaan
- `schema_migrations` untuk mencatat migration yang sudah diterapkan

Constraint penting yang sudah aktif:

- nomor undian unik dan sesuai format `KEC-XXXX`
- satu peserta hanya bisa menang satu kali (`pemenang.peserta_id` unik)
- satu nomor hadiah unik per sesi
- `admin_kecamatan.role` hanya `admin` atau `operator`
- nama sekolah unik setelah kapital dan spasi dinormalisasi

## Asumsi & catatan

1. **Operator** menggunakan tabel `admin_kecamatan` dengan kolom tambahan `role`. Ini diperlukan karena skema awal belum memiliki tabel operator, sementara aturan bisnis mewajibkan role operator.
2. **Akun sekolah** dapat dibuat sendiri lewat `/daftar-sekolah` atau oleh admin melalui dashboard. Seed CLI tetap dapat membuat satu akun sekolah contoh bila `SEED_SCHOOL_USERNAME` diisi.
3. **Logo PGRI** tersedia di `apps/web/public/logo-pgri.png` dan sudah dipakai pada kartu serta header.
4. **Rate limiting** login dan pendaftaran berjalan di memori proses web. Bila aplikasi dijalankan di beberapa instance, hitungan tidak dibagi antar-instance; tetap aktifkan rate limit di reverse proxy atau WAF. IP diambil dari `X-Forwarded-For`/`X-Real-IP`, jadi pastikan reverse proxy menimpa header tersebut.
5. Import hanya menambahkan data; tidak ada mekanisme replace/rollback massal.
6. `DATABASE_POOL_MAX` dapat diturunkan saat memakai layanan PostgreSQL dengan batas koneksi ketat.
7. Kartu undian dan hasil undian bersifat publik. Kartu menampilkan nama, sekolah, dan peran; hasil menampilkan pemenang resmi.
8. Event realtime dikirim dari web ke WS server lewat endpoint internal yang dilindungi `WS_INTERNAL_SECRET`. Bila secret belum diatur, undian tetap tersimpan tetapi layar tidak menerima event langsung.
9. Jika koneksi realtime gagal, halaman live tetap memperbarui data lewat polling setiap 10 detik.

## Keamanan yang sudah diterapkan

- Password disimpan dengan bcrypt (cost 12).
- JWT ditandatangani HS256 dan disimpan di cookie `HttpOnly`, `SameSite=Lax`, `Secure` saat produksi.
- Pesan error login tidak membocorkan apakah username atau password yang salah.
- Login dan pendaftaran sekolah dibatasi per IP dengan respons `429` dan `Retry-After`.
- Nama sekolah duplikat ditolak berdasarkan perbandingan tanpa kapital dan spasi berlebih, ditegakkan juga oleh unique index database.
- Admin dapat mereset password akun sekolah tanpa mengetahui password lama.
- Route dashboard dilindungi middleware dan validasi server component.
- Pengundian memakai `crypto.randomInt` melalui Fisher-Yates; tidak ada `Math.random()` pada alur undian.
- Aksi undian diserialkan dengan advisory lock dan dilindungi role `operator`.
- Pemenang tidak dapat menang dua kali, ditegakkan oleh filter server dan unique constraint database.

## Selanjutnya

Tidak ada fase pengembangan tersisa. Aplikasi siap diuji di lingkungan produksi
mengikuti [DEPLOY.md](./DEPLOY.md). Perubahan di luar lingkup fitur (misalnya
verifikasi email sekolah, captcha, atau manajemen operator multi-akun) dapat
ditambahkan setelah acara.
