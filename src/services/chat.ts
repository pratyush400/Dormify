export function chatIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}
