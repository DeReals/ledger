/**
 * Small helpers for showing money and dates nicely.
 */

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  // dateStr is "YYYY-MM-DD"; parse as local date to avoid off-by-one.
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Today's date as "YYYY-MM-DD" in the user's local time. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** First day of the month "YYYY-MM-01" for a given date string. */
export function monthStart(dateStr: string): string {
  return dateStr.slice(0, 7) + "-01";
}

/** Shift a "YYYY-MM-01" month string by n months (n can be negative). */
export function addMonths(monthStr: string, n: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const date = new Date(y, m - 1 + n, 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}

/** "July 2026" from a "YYYY-MM-01" month string. */
export function formatMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
