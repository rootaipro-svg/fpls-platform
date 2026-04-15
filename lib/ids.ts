export function makeId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString().slice(-6);
  return `${prefix}-${stamp}${random}`;
}
