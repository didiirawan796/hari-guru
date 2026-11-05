# Panduan Deploy — Undian Digital Hari Guru 2026

Dokumen ini menjelaskan cara menjalankan aplikasi di server produksi untuk acara
25 November 2026. Arsitektur terdiri dari tiga komponen yang harus hidup bersamaan:

```text
Browser
  │
  ├── HTTPS ──► Next.js (apps/web, port 3000)
  │                │
  │                ├── PostgreSQL (DATABASE_URL)
  │                │
  │                └── POST /internal/emit ──► Socket.io server (apps/ws-server, port 4000)
  │                                                   ▲
  └── WSS ────────────────────────────────────────────┘
```

- **Web** menangani halaman, API, autentikasi, pengundian, dan export.
- **WS server** hanya menyiarkan event `undian:drawing` dan `undian:update` ke layar panggung dan halaman live.
- **PostgreSQL** menyimpan seluruh data dan menjadi sumber kebenaran hasil undian.

Web tetap berfungsi tanpa WS server (halaman live melakukan polling 10 detik),
tetapi pengalaman panggung terbaik memerlukan keduanya.

## 1. Prasyarat server

- Node.js **>= 20.9** (disarankan Node 22 LTS)
- PostgreSQL **13+** (Supabase, Neon, Railway, atau server sendiri)
- Reverse proxy untuk HTTPS, misalnya Nginx atau Caddy
- Dua subdomain/port yang dapat diakses publik:
  - `https://undian.contoh.id` → Next.js
  - `https://ws.undian.contoh.id` → Socket.io

> Aplikasi memakai cookie sesi `Secure` saat `NODE_ENV=production`.
> Akses produksi **wajib lewat HTTPS**, jika tidak login tidak akan tersimpan.

## 2. Variabel environment

Salin `.env.example` menjadi `.env` di root repository. Semua proses (web, WS,
migrate, seed) membaca file yang sama.

| Variabel | Wajib | Contoh produksi | Catatan |
| --- | --- | --- | --- |
| `DATABASE_URL` | ya | `postgresql://user:pass@host:5432/hari_guru` | Koneksi SSL aktif otomatis di produksi untuk host non-localhost. |
| `DATABASE_POOL_MAX` | tidak | `10` | Turunkan bila layanan DB membatasi koneksi. |
| `JWT_SECRET` | ya | hasil `openssl rand -base64 48` | Minimal 32 karakter. Ganti bila pernah bocor. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | saat seed | `admin` / password kuat | Dipakai `db:seed`. |
| `OPERATOR_USERNAME` / `OPERATOR_PASSWORD` | saat seed | `operator` / password kuat | Akun untuk mengundi di panggung. |
| `SEED_SCHOOL_*` | tidak | — | Akun sekolah contoh; boleh dikosongkan di produksi. |
| `WS_URL` | ya | `https://ws.undian.contoh.id` | Dibaca **runtime** oleh web untuk memanggil `/internal/emit`. |
| `NEXT_PUBLIC_WS_URL` | ya | `https://ws.undian.contoh.id` | Dibaca **saat build**; harus diisi sebelum `npm run build`. |
| `WS_INTERNAL_SECRET` | ya | hasil `openssl rand -base64 48` | Secret bersama web ↔ WS. |
| `PORT` | ya (WS) | `4000` | Port internal WS server. |
| `CORS_ORIGIN` | ya (WS) | `https://undian.contoh.id` | Daftar origin dipisah koma bila perlu. |
| `NODE_ENV` | ya | `production` | Mengaktifkan cookie `Secure` dan SSL DB. |

Catatan penting:

- `NEXT_PUBLIC_WS_URL` **tertanam di bundle saat build**. Jika domain WS berubah,
  jalankan ulang `npm run build`.
- `WS_URL` dan `WS_INTERNAL_SECRET` dibaca saat runtime oleh server Next.js,
  jadi bisa diubah tanpa rebuild.
- `CORS_ORIGIN` harus berisi origin web persis (skema + host + port), tanpa
  trailing slash. Beberapa origin dipisahkan koma.

## 3. Build

Di server (atau di CI yang menghasilkan artefak yang sama):

```bash
npm ci
npm run build
```

Perintah build menjalankan:

1. build `@hari-guru/db` ke `packages/db/dist`
2. `next build` untuk `apps/web`
3. `tsc` untuk `apps/ws-server` ke `apps/ws-server/dist`

Pastikan `.env` sudah berisi `NEXT_PUBLIC_WS_URL` produksi sebelum langkah ini.

## 4. Migrasi dan seed

```bash
npm run db:migrate
npm run db:seed
```

- Migrasi bersifat idempotent dan dicatat di tabel `schema_migrations`.
- Migration `002_sekolah_nama_unik.sql` menolak nama sekolah duplikat (tanpa
  membedakan kapital dan spasi berlebih). Jika database lama sudah memiliki
  duplikat, migrasi akan gagal; rapikan nama sekolah yang duplikat terlebih
  dahulu, lalu jalankan ulang `npm run db:migrate`.
- Seed melakukan upsert akun admin/operator, sehingga aman dijalankan ulang.
  **Menjalankan seed ulang akan mengatur ulang password** akun sesuai `.env`.
- `db:migrate` dan `db:seed` memakai `tsx` (devDependency). Jika server hanya
  memasang dependency produksi, jalankan migrasi/seed dari mesin build yang
  memiliki dependency lengkap, atau jalankan `npm ci` tanpa `--omit=dev`.

## 5. Menjalankan layanan

Gunakan process manager (systemd, PM2, atau container) agar proses hidup terus.

### Web (Next.js)

```bash
npm run start:web
```

- Default port Next.js: `3000`. Ubah dengan `next start -p <port>` bila perlu.
- Kesehatan: `GET /api/health` → `{"status":"ok","database":"connected"}`.
  Status `503` berarti koneksi database bermasalah.

### WS server (Socket.io)

```bash
npm run start:ws
```

- Mendengarkan `PORT` (default `4000`).
- Kesehatan: `GET /health` → memuat `status`, `connections`, dan `timestamp`.

Kedua proses harus berbagi nilai `WS_INTERNAL_SECRET` yang sama.

## 6. Reverse proxy dan HTTPS

### Nginx (contoh)

```nginx
server {
  listen 443 ssl;
  server_name undian.contoh.id;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 443 ssl;
  server_name ws.undian.contoh.id;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
  }
}
```

- Header `Upgrade`/`Connection` wajib untuk WebSocket.
- Untuk Caddy, cukup arahkan kedua domain ke port masing-masing; Caddy menangani
  TLS dan upgrade secara otomatis.
- Jangan mengekspos port `4000` langsung ke internet tanpa TLS.

## 7. Pemeriksaan pasca-deploy

Lakukan berurutan sebelum acara:

1. `GET https://undian.contoh.id/api/health` → `database: connected`.
2. `GET https://ws.undian.contoh.id/health` → `status: ok`.
3. Buka `/login-admin`, masuk dengan akun admin, pastikan diarahkan ke `/admin`.
4. Buka `/login-sekolah` dengan akun sekolah uji, pastikan dashboard tampil.
5. Buka `/daftar-sekolah`, daftarkan sekolah uji, pastikan langsung masuk ke
   dashboard. Coba daftarkan nama sekolah yang sama dengan kapital/spasi berbeda;
   pendaftaran harus ditolak.
6. Dari `/admin`, uji **Reset password** pada sekolah uji, lalu login ulang
   dengan password baru.
7. Buka `/layar` di perangkat panggung; indikator koneksi harus **Live**.
8. Buka `/live` di ponsel; pastikan ikut memperbarui saat undian diuji.
9. Uji satu undian nyata pada sesi percobaan, lalu hapus sesi tersebut
   (hanya bisa dihapus bila belum ada pemenang).
10. Pastikan `/kartu/KEC-0001` menampilkan kartu dan tombol cetak berfungsi.

## 8. Checklist hari acara

**H-1**

- [ ] Migrasi dan seed dijalankan di database produksi.
- [ ] Password admin dan operator diganti dari nilai contoh.
- [ ] `JWT_SECRET` dan `WS_INTERNAL_SECRET` acak, minimal 32 karakter.
- [ ] `NEXT_PUBLIC_WS_URL` menunjuk domain WSS produksi dan build sudah diulang.
- [ ] Seluruh sekolah sudah mengimpor peserta; jumlah peserta dicek di `/admin`.
- [ ] Sesi hadiah dan target pemenang sudah dibuat sesuai rundown.
- [ ] Backup database diambil (`pg_dump`).
- [ ] Uji cetak kartu dan uji undian percobaan selesai.

**Hari-H**

- [ ] Web dan WS server hidup; health check hijau.
- [ ] `/layar` terbuka di laptop panggung, terhubung ke proyektor.
- [ ] `/operator` terbuka di perangkat operator (jangan di panggung).
- [ ] Koneksi internet panggung memiliki cadangan (hotspot).
- [ ] Buka `/live` dan `/hasil` untuk publik.
- [ ] Tim operator tahu urutan sesi dan tombol yang dipakai.

**Setelah acara**

- [ ] Export CSV pemenang setiap sesi.
- [ ] Unduh halaman `/hasil` atau simpan PDF sebagai arsip.
- [ ] Ambil backup database final.

## 9. Troubleshooting

| Gejala | Kemungkinan penyebab | Tindakan |
| --- | --- | --- |
| Login berhasil tetapi kembali ke halaman login | Cookie `Secure` aktif tanpa HTTPS | Akses lewat HTTPS atau set `NODE_ENV` yang sesuai. |
| Indikator layar terus "Menghubungkan" | `NEXT_PUBLIC_WS_URL` salah atau build lama | Perbaiki env, jalankan ulang `npm run build`. |
| Layar tidak berubah tetapi data di `/hasil` benar | `WS_URL`/`WS_INTERNAL_SECRET` tidak cocok | Samakan secret di web dan WS, cek log web. |
| WS menolak koneksi browser | `CORS_ORIGIN` tidak cocok | Isi origin web persis, tanpa trailing slash. |
| `/api/health` mengembalikan 503 | Database tidak dapat dihubungi | Cek `DATABASE_URL`, SSL, dan batas koneksi. |
| Error "JWT_SECRET wajib diatur minimal 32 karakter" | Secret kosong/terlalu pendek | Isi `JWT_SECRET` minimal 32 karakter. |
| Undian ditolak "Tidak ada peserta yang masih memenuhi syarat" | Semua peserta sudah pernah menang | Tambah peserta baru atau tutup sesi; ini perilaku benar. |
| Layar menampilkan sesi yang salah | Sesi lain masih berstatus berjalan | Mulai sesi yang diinginkan; sesi lama otomatis ditutup. |
| Tombol undian nonaktif | Sesi belum dimulai, sudah selesai, atau target terpenuhi | Tekan **Mulai sesi** atau pilih sesi lain. |

## 10. Backup dan pemulihan

Backup harian sebelum dan sesudah acara:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=hari-guru-$(date +%F).dump
```

Pemulihan ke database kosong:

```bash
pg_restore --dbname="$DATABASE_URL" --clean --if-exists hari-guru-2026-11-25.dump
```

Hasil undian bersifat final di database. Jangan mengedit tabel `pemenang`
secara manual saat acara berlangsung.

## 11. Catatan keamanan produksi

- Ganti seluruh password dan secret contoh sebelum acara.
- Jangan commit `.env`; file ini sudah diabaikan `.gitignore`.
- Batasi akses `/admin` dan `/operator` lewat jaringan internal atau allowlist IP
  di reverse proxy bila memungkinkan.
- Rate limiting login dan pendaftaran sudah aktif di aplikasi (in-memory per
  proses): login 10 percobaan/5 menit per IP, pendaftaran 5/jam per IP. Untuk
  deployment multi-instance atau beban tinggi, tetap tambahkan rate limit di
  reverse proxy/WAF. Aplikasi membaca IP dari `X-Forwarded-For` lalu
  `X-Real-IP`; pastikan reverse proxy menimpa header itu agar tidak dapat
  dipalsukan klien.
- `robots.txt` melarang seluruh perayapan mesin pencari.
- Endpoint `/internal/emit` hanya menerima request dengan header
  `x-internal-secret` yang benar dan hanya mendukung event `undian:drawing`
  serta `undian:update`.
