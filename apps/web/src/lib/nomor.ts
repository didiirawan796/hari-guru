const NOMOR_PATTERN = /^(?:KEC-?)?(\d{1,9})$/;

/**
 * Menormalkan input nomor undian menjadi format kanonik `KEC-XXXX`.
 * Menerima "KEC-0001", "kec-1", "0001", atau "1".
 */
export function normalisasiNomorUndian(value: string): string | null {
  const cleaned = value.trim().toUpperCase().replace(/[\s_]+/g, "");
  const match = NOMOR_PATTERN.exec(cleaned);
  if (!match) return null;

  const digits = match[1].padStart(4, "0");
  return `KEC-${digits}`;
}
