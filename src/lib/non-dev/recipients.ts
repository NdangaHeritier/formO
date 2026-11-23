/** Pure recipient helpers shared by message enqueue and tests. */

/** Case-insensitive, order-preserving dedupe for explicit email addresses. */
export function dedupeEmails(emails: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of emails) {
    const email = raw.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    result.push(email);
  }
  return result;
}

/** Order-preserving dedupe for UUID lists. */
export function dedupeIds(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}
