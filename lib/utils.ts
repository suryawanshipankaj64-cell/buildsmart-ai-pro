export function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}
export function formatNumber(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(n || 0);
}
export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function cx(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
