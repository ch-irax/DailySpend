export function createId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
