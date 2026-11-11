/** Reuse unchanged plain scene subtrees between detached controller snapshots. */
export function reconcile<T>(previous: T, next: T): T {
  if (previous === next) return previous
  if (
    !previous ||
    !next ||
    typeof previous !== 'object' ||
    typeof next !== 'object' ||
    Array.isArray(previous) !== Array.isArray(next)
  )
    return next
  const before = previous as Record<string, unknown>,
    after = next as Record<string, unknown>
  const keys = Object.keys(after)
  let same = Object.keys(before).length === keys.length
  const result: Record<string, unknown> = Array.isArray(next)
    ? ([] as unknown as Record<string, unknown>)
    : {}
  for (const key of keys) {
    const value = reconcile(before[key], after[key])
    result[key] = value
    if (value !== before[key] || !Object.hasOwn(before, key)) same = false
  }
  return same ? previous : (result as T)
}
