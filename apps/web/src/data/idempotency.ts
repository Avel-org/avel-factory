/**
 * One `Idempotency-Key` per user intent (FM 206): made once on the confirming tap, and reused
 * only to retry that same request.
 */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
