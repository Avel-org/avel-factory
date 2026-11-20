/** T-B14-01 (Step 1 test 2): route 9's output is exactly ClientDto, and route 10 returns the same. */
import { ClientDto } from "@avel/contract";
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import { clientsApp, newKey, operatorCookie, send } from "./support.ts";

const database = testDatabase("b14dto");

const DTO_FIELDS = Object.keys(ClientDto.shape).sort();

describe("T-B14-01 · route 9 returns ClientDto and nothing else", () => {
  it("creates a client whose output has exactly ClientDto's fields, checked against the contract", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);

    const res = await send(app, "POST", "/api/clients", {
      cookie,
      key: newKey(),
      body: { name: "  Acme Roofing  ", kind: "client", contacts: [{ name: "Pat" }] },
    });
    expect(res.status).toBe(201);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(res.headers.get("x-contract-version")).toBeTruthy();
    const raw = (await res.json()) as Record<string, unknown>;

    // No internal column leaves: the keys are exactly the contract's.
    expect(Object.keys(raw).sort()).toEqual(DTO_FIELDS);
    const dto = ClientDto.parse(raw);
    expect(dto.name).toBe("Acme Roofing");
    expect(dto.kind).toBe("client");
    expect(dto.status).toBe("active");
    expect(dto.archivedAt).toBeNull();
    expect(dto.proofConsentAt).toBeNull();
    expect(dto.rowVersion).toBe(1);
    expect(dto.contacts).toEqual([{ name: "Pat" }]);

    // Route 10 reads back the same object.
    const got = await send(app, "GET", `/api/clients/${dto.id}`, { cookie });
    expect(got.status).toBe(200);
    expect(await got.json()).toEqual(raw);
  });
});
