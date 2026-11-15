export function pesosToCentavos(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function centavosToPesos(value: number): string {
  return (value / 100).toFixed(2);
}

export function formatMoney(value: number, compact = false): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 1 : 2,
    notation: compact ? 'compact' : 'standard',
  }).format(value / 100);
}

export function isValidAmount(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}
