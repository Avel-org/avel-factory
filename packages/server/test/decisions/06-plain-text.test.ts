/** T-B24-06: text in a proposal comes back as the same plain characters, never HTML-escaped or rendered. */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  clientsApp,
  listDecisions,
  operatorCookie,
  seedMission,
  seedProposal,
  send,
} from "./support.ts";

const database = testDatabase("b24plain");
const SCRIPT = "<script>alert(1)</script>";

describe("T-B24-06 · plain text", () => {
  it("returns a <script> in a proposal's reason and subject unchanged on routes 52 and 53", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const m = await seedMission(d.url);
    const id = await seedProposal(m, { reason: `Because ${SCRIPT}`, subjectKey: `x-${SCRIPT}` });

    const res53 = await send(app, "GET", `/api/proposals/${id}`, { cookie });
    expect(res53.status).toBe(200);
    expect(res53.headers.get("content-type")).toMatch(/^application\/json/);
    const text53 = await res53.text();
    expect(text53).toContain(SCRIPT);

    const list = await listDecisions(app, cookie, "?limit=100");
    const text52 = JSON.stringify(list.raw);
    expect(text52).toContain(SCRIPT);
    expect(text52).not.toContain("&lt;script");
    expect(text53).not.toContain("&lt;script");
  });
});
