-- Fase 6: verifikasi nama sekolah
-- Nama sekolah dibandingkan tanpa membedakan huruf besar/kecil dan dengan
-- spasi yang dirapikan, sehingga "SD Negeri 1" dan "  sd   negeri   1 "
-- dianggap sama.
CREATE UNIQUE INDEX sekolah_nama_normal_unik
  ON sekolah (
    lower(regexp_replace(btrim(nama_sekolah), '[[:space:]]+', ' ', 'g'))
  );
