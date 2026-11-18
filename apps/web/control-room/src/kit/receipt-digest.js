// A port of @avel/contract's receiptDigestInput (dto/receipts.ts, contract 1.0.0): the receipt's
// digest is SHA-256 over these lines, joined with "\n" and UTF-8 encoded. The server, the mock and
// this check all build it the same way, so a match here means the receipt covers these exact files.
export function receiptDigestInput(r) {
  return [r.id, r.commitSha, r.verdict, r.createdAt, ...r.artifacts.map((a) => a.sha256)].join("\n");
}
