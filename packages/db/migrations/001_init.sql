-- Fase 1: skema inti undian digital Hari Guru 2026
-- PostgreSQL 13+ (Supabase/Railway/Neon)

CREATE TYPE peran_peserta AS ENUM ('kepsek', 'guru');
CREATE TYPE status_sesi_hadiah AS ENUM ('belum', 'berjalan', 'selesai');

CREATE TABLE sekolah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_sekolah text NOT NULL CHECK (length(trim(nama_sekolah)) > 0),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sekolah_username_format
    CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,49}$')
);

CREATE TABLE peserta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sekolah_id uuid NOT NULL REFERENCES sekolah(id) ON DELETE CASCADE,
  nama text NOT NULL CHECK (length(trim(nama)) > 0),
  peran peran_peserta NOT NULL,
  nomor_undian text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT peserta_nomor_format
    CHECK (nomor_undian ~ '^KEC-[0-9]{4,}$')
);

CREATE TABLE sesi_hadiah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_hadiah text NOT NULL CHECK (length(trim(nama_hadiah)) > 0),
  urutan integer NOT NULL CHECK (urutan > 0),
  jumlah_pemenang integer NOT NULL CHECK (jumlah_pemenang > 0),
  status status_sesi_hadiah NOT NULL DEFAULT 'belum',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sesi_hadiah_urutan_unik UNIQUE (urutan)
);

CREATE TABLE pemenang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id uuid NOT NULL REFERENCES sesi_hadiah(id) ON DELETE CASCADE,
  peserta_id uuid NOT NULL REFERENCES peserta(id) ON DELETE RESTRICT,
  hadiah_ke integer NOT NULL CHECK (hadiah_ke > 0),
  waktu_menang timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pemenang_peserta_unik UNIQUE (peserta_id),
  CONSTRAINT pemenang_sesi_hadiah_unik UNIQUE (sesi_id, hadiah_ke)
);

-- Operator panitia memakai tabel admin_kecamatan dengan role terpisah.
CREATE TABLE admin_kecamatan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_role_valid CHECK (role IN ('admin', 'operator')),
  CONSTRAINT admin_username_format
    CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,49}$')
);

-- Nomor undian KEC-0001, KEC-0002, ... dialokasikan lewat sequence agar aman
-- terhadap proses bersamaan. Aplikasi memformat nilainya pada Fase 3.
CREATE SEQUENCE nomor_undian_seq
  AS integer
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

CREATE INDEX peserta_sekolah_id_idx ON peserta(sekolah_id);
CREATE INDEX pemenang_sesi_id_idx ON pemenang(sesi_id);
CREATE INDEX pemenang_waktu_menang_idx ON pemenang(waktu_menang DESC);
CREATE INDEX sesi_hadiah_urutan_idx ON sesi_hadiah(urutan);
