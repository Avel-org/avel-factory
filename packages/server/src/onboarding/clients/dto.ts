import { ClientDto } from "@avel/contract";
import type { clients } from "@avel/db";

type ClientRow = typeof clients.$inferSelect;

const iso = (time: Date | null) => (time === null ? null : time.toISOString());

/**
 * The one mapper from a `clients` row to `ClientDto` (AGENTS.md, API rules: DTOs). It names each
 * field the contract has, so no other column leaves, and checks the result against the contract.
 */
export const toClientDto = (row: ClientRow): ClientDto =>
  ClientDto.parse({
    id: row.id,
    name: row.name,
    contacts: row.contacts,
    status: row.status,
    archivedAt: iso(row.archivedAt),
    kind: row.kind,
    proofConsentAt: iso(row.proofConsentAt),
    createdAt: row.createdAt.toISOString(),
    rowVersion: row.rowVersion,
    updatedAt: row.updatedAt.toISOString(),
  });
