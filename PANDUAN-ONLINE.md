# Panduan Onlinekan & Publikasi ke Banyak Sekolah

Dokumen ini menjelaskan langkah operasional untuk menaikkan aplikasi **Gebyar HUT PGRI PC Tanjung** ke internet, kemudian membagikannya ke banyak sekolah.

Panduan teknis server (Nginx, systemd, backup, troubleshooting) tetap ada di [DEPLOY.md](./DEPLOY.md). Dokumen ini fokus pada jalur yang paling praktis: **GitHub → Railway (web + WebSocket + PostgreSQL) → domain sendiri**.

---

## 0. Gambaran arsitektur

Aplikasi terdiri dari tiga bagian yang harus hidup bersamaan:

```text
Browser sekolah / panggung
   │
   ├── https://undian.domain-anda.id  → Next.js (web + API + login)
   │        │
   │        ├── PostgreSQL (data sekolah, peserta, pemenang)
   │        │
   │        └── https://ws.domain-anda.id → Socket.io (layar live)
   │
   └── wss://ws.domain-anda.id → Socket.io (langsung dari browser)
```

| Komponen | Fungsi | Wajib online? |
| --- | --- | --- |
| Web Next.js | Halaman, login, API, proses undian, export | Ya |
| PostgreSQL | Menyimpan seluruh data dan hasil undian | Ya |
| WS Socket.io | Menyiarkan pemenang ke `/layar` dan `/live` secara real-time | Ya, untuk pengalaman panggung terbaik |

Tanpa WS, halaman live tetap memperbarui data setiap 10 detik (polling), tetapi animasi panggung tidak instan.

> **Penting:** aplikasi ini dirancang untuk **satu event / satu kecamatan** (PC Kecamatan Tanjung). Banyak sekolah memakai satu instalasi dan satu database. Jika nanti ingin melayani beberapa kecamatan dengan data terpisah, itu memerlukan fitur multi-tenant tersendiri.

---

## 1. Yang perlu disiapkan

1. **Domain**, misalnya:
   - `undian.pc-tanjung.id` untuk web
   - `ws.undian.pc-tanjung.id` untuk WebSocket
   
   Bisa juga memakai satu domain dengan subdomain WS. Domain harus bisa diatur DNS-nya (Cloudflare, Niagahoster, Rumahweb, dsb.).

2. **Akun GitHub** untuk menyimpan kode.

3. **Akun Railway** (https://railway.com) dengan pembayaran aktif. Pilih paket berbayar; paket gratis/trial bisa tidur saat tidak dipakai dan tidak cocok untuk hari acara.

4. **Akun database** hanya jika memilih jalur alternatif (Neon/Supabase). Pada jalur utama, PostgreSQL dibuat langsung di Railway.

5. **Kode aplikasi** di komputer ini.

---

## 2. Unggah kode ke GitHub

Repo ini belum menjadi repo Git. Jalankan di root proyek:

```bash
git init
git add .
git commit -m "Siap onlinekan Gebyar HUT PGRI PC Tanjung"
git branch -M main
```

Buat repository baru di GitHub (private lebih aman), lalu:

```bash
git remote add origin https://github.com/USERNAME/hari-guru.git
git push -u origin main
```

Periksa:

- File `.env` **tidak boleh** ikut terunggah. `.gitignore` sudah mengecualikannya.
- File `.env.example` boleh ikut, tetapi isinya hanya contoh.
- Pastikan `package-lock.json` ikut terunggah agar build konsisten.

---

## 3. Buat project di Railway

1. Buka https://railway.com → **New Project**.
2. Pilih **Deploy from GitHub repo** → pilih repo `hari-guru`.
3. Railway akan membuat satu service. Ganti namanya menjadi **web**.
4. Di project yang sama, klik **New** → **Database** → **Add PostgreSQL**.
5. Tunggu sampai database selesai dibuat.

### Ambil connection string database

1. Klik service PostgreSQL.
2. Buka tab **Variables** / **Connect**.
3. Salin **DATABASE_URL** (bentuknya `postgresql://postgres:...@...:5432/railway`).
4. Simpan di catatan aman. Nilai ini dipakai oleh web dan proses migrasi.

> Gunakan URL **public** jika migrasi dijalankan dari komputer lokal. Gunakan URL **internal** jika proses berjalan di dalam Railway.

---

## 4. Konfigurasi service Web

Klik service **web** → **Settings**.

### 4.1 Build & start command

Isi:

| Setting | Nilai |
| --- | --- |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm run db:migrate && npm run start:web` |

Penjelasan:

- `--include=dev` diperlukan karena proses build dan migrasi memakai TypeScript/`tsx` yang ada di devDependencies.
- `db:migrate` aman dijalankan setiap start karena migrasi bersifat idempotent (hanya menjalankan migrasi baru).
- **Jangan** menaruh `db:seed` di start command, karena seed akan mengatur ulang password admin/operator setiap kali service restart.

### 4.2 Environment variables Web

Buka tab **Variables** → **Raw Editor**, lalu isi:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...hasil-salinan-railway...
DATABASE_POOL_MAX=10
JWT_SECRET=hasil-openssl-rand-base64-48
WS_URL=https://ws.undian.domain-anda.id
NEXT_PUBLIC_WS_URL=https://ws.undian.domain-anda.id
WS_INTERNAL_SECRET=hasil-openssl-rand-base64-48
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password-admin-kuat-dan-unik
OPERATOR_USERNAME=operator
OPERATOR_PASSWORD=password-operator-kuat-dan-unik
```

Membuat secret acak:

- Linux/macOS/WSL: `openssl rand -base64 48`
- Windows PowerShell:
  ```powershell
  [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
  ```

Catatan:

- `NEXT_PUBLIC_WS_URL` **dibaca saat build**. Jika nilainya diubah, lakukan **Redeploy** web agar nilai baru tertanam di bundle.
- `WS_URL` dan `WS_INTERNAL_SECRET` dibaca saat runtime.
- Jangan memakai password contoh dari `.env.example`.

### 4.3 Domain Web

1. Service web → **Settings** → **Networking** → **Generate Domain** (untuk uji coba).
2. Untuk domain sendiri: **Custom Domain** → masukkan `undian.domain-anda.id`.
3. Railway menampilkan target CNAME. Salin.
4. Di pengelola DNS domain, buat:
   - Type: `CNAME`
   - Name: `undian`
   - Value: target dari Railway
   - TTL: default
5. Tunggu sampai status domain **Active** dan HTTPS terpasang.

Jika memakai Cloudflare:

- Awalnya gunakan mode **DNS only** (awan abu-abu) agar verifikasi domain lancar.
- Setelah aktif, proxy Cloudflare boleh diaktifkan; pastikan WebSocket diizinkan.

---

## 5. Konfigurasi service WebSocket

Masih di project Railway yang sama:

1. Klik **New** → **GitHub Repo** → pilih repo yang sama.
2. Ganti nama service menjadi **ws**.
3. **Settings**:
   - Build Command: `npm ci --include=dev && npm run build`
   - Start Command: `npm run start:ws`
4. **Variables**:

```env
NODE_ENV=production
WS_INTERNAL_SECRET=secret-yang-SAMA-dengan-service-web
CORS_ORIGIN=https://undian.domain-anda.id
```

Jangan set `PORT` secara manual. Railway menyuntikkan `PORT` otomatis, dan server WS sudah membaca `process.env.PORT`.

5. **Networking** → **Custom Domain** → `ws.undian.domain-anda.id`.
6. Buat CNAME `ws` di DNS ke target Railway, sama seperti langkah web.

Catatan penting:

- `WS_INTERNAL_SECRET` di service **web** dan **ws** harus **persis sama**.
- `CORS_ORIGIN` harus origin web lengkap, tanpa garis miring di akhir.
- Jangan membuka port WS langsung tanpa TLS.
- **Jalankan hanya satu replika WS.** Aplikasi belum memakai Redis adapter; jika ada dua instance WS, event hanya sampai ke instance yang menerima request `/internal/emit`. Jika perlu banyak instance, tambahkan `@socket.io/redis-adapter` terlebih dahulu.

---

## 6. Isi database produksi

### 6.1 Migrasi

Jika start command web sudah memakai `npm run db:migrate && npm run start:web`, migrasi berjalan otomatis saat deploy pertama. Periksa log deploy sampai muncul pesan sukses.

Alternatif manual dari komputer lokal (PowerShell):

```powershell
$env:DATABASE_URL="postgresql://...url-public-railway..."
$env:NODE_ENV="production"
npm ci --include=dev
npm run db:migrate
```

Alternatif dari dalam Railway: buka **web → Shell** (atau `railway run`) lalu jalankan:

```bash
npm run db:migrate
```

### 6.2 Seed akun admin & operator

Seed hanya dijalankan **sekali** (atau saat sengaja ingin mengatur ulang password). Perintah ini membuat/memperbarui akun admin dan operator dari variabel environment.

Dari komputer lokal:

```powershell
$env:DATABASE_URL="postgresql://...url-public-railway..."
$env:NODE_ENV="production"
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="password-admin-kuat"
$env:OPERATOR_USERNAME="operator"
$env:OPERATOR_PASSWORD="password-operator-kuat"
npm run db:seed
```

Atau melalui Railway CLI:

```bash
npm i -g @railway/cli
railway login
railway link
railway run npm run db:seed
```

> Seed **mengatur ulang password** akun sesuai env. Jangan dijalankan setelah acara dimulai kecuali memang ingin reset.
>
> Akun sekolah **tidak perlu** di-seed. Sekolah mendaftar sendiri lewat `/daftar-sekolah`.

### 6.3 Verifikasi database

Buka:

```text
https://undian.domain-anda.id/api/health
```

Harus mengembalikan status `ok` dan `database: connected`.

---

## 7. Deploy ulang setelah mengubah environment

Alur yang benar:

1. Ubah variabel di Railway (misalnya `NEXT_PUBLIC_WS_URL`).
2. Klik **Redeploy** pada service **web**.
3. Tunggu build selesai.
4. Cek kembali halaman `/layar`; indikator koneksi harus **Live**.

Jika hanya mengubah `WS_URL`, `JWT_SECRET`, atau `CORS_ORIGIN`, redeploy tetap disarankan agar proses memuat env baru.

---

## 8. Pemeriksaan sebelum dibagikan ke sekolah

Lakukan berurutan:

- [ ] `https://undian.domain-anda.id/api/health` → `database: connected`
- [ ] `https://ws.undian.domain-anda.id/health` → `status: ok`
- [ ] Login admin di `/login-admin` berhasil
- [ ] Login operator di `/login-admin` lalu diarahkan ke `/operator`
- [ ] `/daftar-sekolah` bisa membuat akun dan langsung masuk dashboard
- [ ] Nama sekolah duplikat (beda kapital/spasi) ditolak
- [ ] `/layar` menampilkan indikator **Live**
- [ ] `/live` ikut berubah saat undian diuji
- [ ] `/kartu/KEC-0001` tampil dan tombol cetak berfungsi
- [ ] `/hasil` menampilkan rekap
- [ ] Coba satu undian percobaan, lalu hapus sesi percobaan tersebut
- [ ] Export CSV pemenang berhasil
- [ ] Tampilan HP 360–414 px tidak terpotong

---

## 9. Cara mempublikasikan ke banyak sekolah

### 9.1 Satu tautan untuk semua sekolah

Bagikan tautan pendaftaran:

```text
https://undian.domain-anda.id/daftar-sekolah
```

Setiap sekolah:

1. Membuka tautan.
2. Mengisi nama sekolah, username, dan password.
3. Akun langsung aktif dan otomatis masuk ke `/dashboard-sekolah`.
4. Mengisi data kepala sekolah dan guru (manual atau import Excel/CSV).
5. Mengunduh/mencetak kartu undian tiap peserta.

Tidak ada batas jumlah sekolah di aplikasi. Yang membatasi adalah kapasitas database dan trafik.

### 9.2 Contoh pesan WhatsApp untuk sekolah

```text
Assalamualaikum Bapak/Ibu,

Dalam rangka Gebyar HUT PGRI PC Kecamatan Tanjung, panitia membuka
pendaftaran peserta doorprize secara online.

Silakan daftarkan sekolah melalui:
https://undian.domain-anda.id/daftar-sekolah

Langkah:
1. Daftar akun sekolah (nama sekolah, username, password).
2. Masuk ke dashboard sekolah.
3. Isi data Kepala Sekolah dan Guru, atau import file Excel/CSV.
4. Simpan dan cetak kartu undian masing-masing peserta.

Batas penginputan: [tanggal, jam].

Jika lupa password, hubungi panitia untuk reset.
Terima kasih.
```

### 9.3 Strategi rollout

1. **Uji internal** dengan 1–2 sekolah percontohan.
2. **Sosialisasi** ke semua sekolah + kirim panduan singkat.
3. **Pantau** jumlah peserta per sekolah di `/admin`.
4. **Ingatkan** sekolah yang belum mengisi H-3 dan H-1.
5. **Kunci data** sebelum acara; minta sekolah tidak mengubah data lagi.
6. **Cetak cadangan** daftar peserta dari `/admin` atau export CSV.

### 9.4 Peran akun

| Peran | Kegunaan | Jangan dibagikan ke |
| --- | --- | --- |
| Admin | Membuat sesi, memantau semua sekolah, reset password | Sekolah |
| Operator | Menjalankan undian di panggung | Sekolah |
| Sekolah | Mengelola peserta sekolahnya sendiri | Sekolah lain |

Buat password admin dan operator yang panjang, unik, dan hanya diketahui 1–3 orang panitia inti.

---

## 10. Kapasitas dan scaling

### Beban normal

- Ratusan sekolah dan beberapa ribu peserta masih nyaman dengan satu service web + satu PostgreSQL kecil/menengah.
- Layar panggung dan halaman `/live` hanya menerima event kecil; satu instance WS mampu melayani ribuan koneksi tergantung spesifikasi.

### Jika trafik naik

1. **Web**: boleh ditambah replika di Railway. Namun rate limit login/pendaftaran bersifat in-memory per proses. Untuk banyak replika, tambahkan rate limit di Cloudflare/WAF atau pindahkan ke Redis.
2. **WS**: tetap **satu replika** sampai Redis adapter ditambahkan.
3. **Database**: naikkan `DATABASE_POOL_MAX` hanya sesuai batas koneksi paket PostgreSQL. Jangan melebihi kuota koneksi.
4. **Aset gambar/logo**: sudah dilayani Next.js; tidak perlu konfigurasi tambahan.

### Perkiraan kebutuhan

| Skala | Saran |
| --- | --- |
| < 500 peserta, < 50 sekolah | Railway starter + PostgreSQL kecil |
| 500–3.000 peserta | Railway cukup, pantau memori web & koneksi DB |
| > 3.000 peserta atau > 5.000 penonton live | Naikkan paket, uji beban, siapkan Redis untuk WS/rate limit |

---

## 11. Keamanan produksi

- [ ] Ganti semua password dan secret contoh.
- [ ] `.env` tidak pernah masuk GitHub.
- [ ] Domain memakai HTTPS (cookie sesi `Secure`).
- [ ] Batasi akses `/admin` dan `/operator` bila memungkinkan (Cloudflare Access / allowlist IP / VPN panitia).
- [ ] Jangan bagikan tautan operator ke publik.
- [ ] Aktifkan backup otomatis PostgreSQL di Railway.
- [ ] Simpan salinan `.env` di password manager panitia.
- [ ] Aktifkan notifikasi billing Railway agar layanan tidak mati saat acara.
- [ ] Setelah acara, nonaktifkan atau arsipkan project bila tidak dipakai lagi.

---

## 12. Backup sebelum dan sesudah acara

Ambil backup H-1 dan setelah acara:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=hari-guru-$(date +%F).dump
```

Di Windows PowerShell:

```powershell
pg_dump $env:DATABASE_URL --format=custom --file=hari-guru-2026-11-25.dump
```

Simpan file dump di dua tempat (laptop panitia + cloud drive). Jangan mengedit tabel `pemenang` secara manual saat acara berlangsung.

---

## 13. Troubleshooting online

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| Build gagal `tsc: not found` | Dev dependencies tidak terpasang | Gunakan `npm ci --include=dev` |
| Login berhasil lalu kembali ke login | Cookie `Secure` tanpa HTTPS | Pastikan domain aktif HTTPS dan `NODE_ENV=production` |
| `/api/health` 503 | `DATABASE_URL` salah / DB belum siap | Cek URL, status PostgreSQL, dan SSL |
| `/layar` terus “Menghubungkan” | `NEXT_PUBLIC_WS_URL` salah atau build lama | Perbaiki env lalu **redeploy web** |
| Data berubah di `/hasil` tapi layar diam | `WS_URL`/`WS_INTERNAL_SECRET` tidak cocok | Samakan secret, cek log web dan ws |
| WS menolak koneksi | `CORS_ORIGIN` tidak persis sama | Isi `https://undian.domain-anda.id` tanpa `/` di akhir |
| Domain belum aktif | DNS belum propagasi | Tunggu 5–60 menit, cek CNAME |
| Service tidur sendiri | Memakai paket gratis/trial | Gunakan paket berbayar |
| Password sekolah lupa | — | Admin reset dari `/admin` → Data sekolah |

---

## 14. Checklist ringkas hari-H

**H-7**

- [ ] Domain dan HTTPS aktif
- [ ] Web + WS + PostgreSQL sehat
- [ ] Akun admin/operator final
- [ ] Sekolah diundang dan mulai mengisi data

**H-1**

- [ ] Semua sekolah selesai input
- [ ] Jumlah peserta dicek di `/admin`
- [ ] Sesi hadiah dan target pemenang dibuat
- [ ] Backup database
- [ ] Uji undian percobaan
- [ ] Uji `/layar` di laptop panggung + proyektor
- [ ] Uji `/live` di HP

**Hari-H**

- [ ] `/layar` terbuka di perangkat panggung
- [ ] `/operator` hanya di perangkat operator
- [ ] Koneksi internet cadangan (hotspot) siap
- [ ] Publikasikan `/live` dan `/hasil` ke peserta
- [ ] Tim tahu urutan sesi dan tombol yang dipakai

**Setelah acara**

- [ ] Export CSV semua pemenang
- [ ] Simpan `/hasil` sebagai PDF/arsip
- [ ] Backup database final
- [ ] Matikan atau arsipkan layanan jika tidak dipakai

---

## 15. Alternatif hosting

Jika tidak memakai Railway:

- **VPS sendiri** (Ubuntu + Node + PM2 + Nginx + Certbot): ikuti [DEPLOY.md](./DEPLOY.md). Paling fleksibel dan bisa dipakai offline di lokasi acara dengan jaringan lokal.
- **Render**: dua Web Service (web & ws) + PostgreSQL. Pastikan memakai paket berbayar agar tidak tidur.
- **Fly.io / VPS container**: cocok jika tim memiliki kemampuan Docker.
- **Vercel untuk web + Railway/Render untuk WS + Neon/Supabase**: bisa, tetapi monorepo dan build-time `NEXT_PUBLIC_WS_URL` harus diatur hati-hati. Untuk acara, jalur Railway satu project lebih sedikit titik gagal.

---

## 16. Ringkasan urutan tercepat

1. `git init` → push ke GitHub.
2. Railway → New Project → deploy repo → tambah PostgreSQL.
3. Service **web**: build `npm ci --include=dev && npm run build`, start `npm run db:migrate && npm run start:web`, isi env web.
4. Service **ws**: build sama, start `npm run start:ws`, isi `WS_INTERNAL_SECRET` + `CORS_ORIGIN`.
5. Pasang domain `undian...` dan `ws...`, tunggu HTTPS aktif.
6. Jalankan `npm run db:seed` sekali.
7. Cek health web, health WS, login admin, `/layar`, `/live`, `/kartu`.
8. Bagikan `https://undian.domain-anda.id/daftar-sekolah` ke sekolah.
9. Pantau `/admin`, backup database, siapkan hari-H.
