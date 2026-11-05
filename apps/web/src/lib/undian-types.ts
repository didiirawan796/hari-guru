export type StatusSesi = "belum" | "berjalan" | "selesai";
export type PeranPeserta = "kepsek" | "guru";

export interface SesiRingkas {
  id: string;
  namaHadiah: string;
  urutan: number;
  jumlahPemenang: number;
  status: StatusSesi;
  totalPemenang: number;
}

export interface PemenangRecord {
  id: string;
  hadiahKe: number;
  nomorUndian: string;
  nama: string;
  peran: PeranPeserta;
  sekolah: string;
  waktuMenang: string;
}

export interface LiveState {
  sesi: SesiRingkas | null;
  pemenang: PemenangRecord[];
  updatedAt: string;
}

export interface KandidatUndian {
  nomorUndian: string;
  nama: string;
  sekolah: string;
}

export interface DrawingState {
  sesi: SesiRingkas;
  kandidat: KandidatUndian[];
  durasiMs: number;
}

export interface OperatorData {
  sesi: SesiRingkas[];
  live: LiveState;
}

export interface HasilSesi extends SesiRingkas {
  pemenang: PemenangRecord[];
}
