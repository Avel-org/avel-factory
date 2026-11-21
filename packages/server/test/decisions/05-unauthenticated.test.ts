/** T-B24-05: routes 52, 53 and 104 without a session are 401 with the contract's body and requestId. */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  clientsApp,
  expectError,
  operatorCookie,
  seedMission,
  seedProposal,
  send,
  UNKNOWN_PROPOSAL,
} from "./support.ts";

const database = testDatabase("b24unauth");
const REQUEST_ID = "0193a000-0000-7000-8000-0000000b2405";

describe("T-B24-05 · no session", () => {
  it("is 401 UNAUTHORIZED on routes 52, 53 and 104, for no cookie and for a bad one", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    await operatorCookie(app, d.url);
    const m = await seedMission(d.url);
    const proposal = await seedProposal(m);

    for (const cookie of [undefined, "better-auth.session_token=not-a-session"]) {
      const paths = [
        "/api/pending-decisions",
        `/api/proposals/${proposal}`,
        `/api/proposals/${UNKNOWN_PROPOSAL}`,
        "/api/status",
      ];
      for (const path of paths) {
        const res = await send(app, "GET", path, { cookie, requestId: REQUEST_ID });
        const body = await expectError(res, 401, "UNAUTHORIZED");
        expect(body.requestId).toBe(REQUEST_ID);
        expect(body.message).toBe("Not signed in");
      }
    }
  });
});
