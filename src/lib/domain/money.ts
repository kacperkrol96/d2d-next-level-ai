/** Zaokrąglenie kwoty do groszy (unika błędów 0.1 + 0.2). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

export function formatPLN(value: number): string {
  return plnFormatter.format(value);
}
