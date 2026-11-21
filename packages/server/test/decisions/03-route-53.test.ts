/** T-B24-03: route 53 returns a proposal's view, and a 404 with the request's id for an unknown one. */
import { ProposalViewDto } from "@avel/contract";
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

const database = testDatabase("b24route53");
const REQUEST_ID = "0193a000-0000-7000-8000-0000000b2403";

describe("T-B24-03 · route 53", () => {
  it("returns an open proposal as a ProposalViewDto with its choices and bound version", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const m = await seedMission(d.url);
    const id = await seedProposal(m, { reason: "Needs payments-api", subjectKey: "payments-api" });

    const res = await send(app, "GET", `/api/proposals/${id}`, { cookie });
    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const view = ProposalViewDto.parse(await res.json());
    expect(view.kind).toBe("proposal");
    expect(view.target.proposalId).toBe(id);
    expect(view.target.proposalKind).toBe("dependency");
    expect(view.target.subjectKey).toBe("payments-api");
    expect(view.target.version).toBe(1);
    expect(view.target.decidable).toBe(true);
    expect(view.target.choices.map((c) => c.choice)).toEqual(["approve", "reject"]);
    expect(view.state).toBe("open");
    expect(view.choice).toBeNull();
    expect(view.rowVersion).toBe(1);
    expect(view.mission?.id).toBe(m.missionId);
    // A repeated read gives the same answer: a read has no write to replay and no rowVersion to go stale.
    const again = ProposalViewDto.parse(
      await (await send(app, "GET", `/api/proposals/${id}`, { cookie })).json(),
    );
    expect(again).toEqual(view);
  });

  it("returns a resolved proposal with its state and resolution (decided elsewhere)", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const m = await seedMission(d.url);
    const id = await seedProposal(m, { state: "resolved" });
    const res = await send(app, "GET", `/api/proposals/${id}`, { cookie });
    expect(res.status).toBe(200);
    const view = ProposalViewDto.parse(await res.json());
    expect(view.state).toBe("resolved");
    expect(view.choice).toBe("approve");
    expect(view.resolvedAt).not.toBeNull();
  });

  it("is 404 NOT_FOUND with the request's requestId for an unknown proposal", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const m = await seedMission(d.url);
    const known = await seedProposal(m);
    // The route exists (a known id is 200), so the 404 below means "no such proposal", not "no such route".
    expect((await send(app, "GET", `/api/proposals/${known}`, { cookie })).status).toBe(200);
    const res = await send(app, "GET", `/api/proposals/${UNKNOWN_PROPOSAL}`, {
      cookie,
      requestId: REQUEST_ID,
    });
    const body = await expectError(res, 404, "NOT_FOUND");
    expect(body.requestId).toBe(REQUEST_ID);
  });
});
