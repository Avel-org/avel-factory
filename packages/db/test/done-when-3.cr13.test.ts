// Done-when 3: the CR-13 rules, with every foreign key and CHECK in force (nothing is dropped here).
// Each test runs in a transaction that is rolled back.
import { describe, expect, it } from "vitest";
import { migratedDb } from "./helpers/db.ts";
import { attempts } from "./helpers/rowkit.ts";

const db = migratedDb("dw3");

const USER = "'00000000-0000-0000-0000-0000000000f1'";
const CLIENT = "'00000000-0000-0000-0000-0000000000c1'";
const INTERNAL = "'00000000-0000-0000-0000-0000000000c2'";
const MISSION = "'00000000-0000-0000-0000-0000000000a1'";
const SHA = "'rigg_sha_1'";

const base = [
  `insert into users (id, name, email) values (${USER}, 'Rigg', 'rigg@example.test')`,
  `insert into factory_versions (sha, merged_at, approved_by, merged_by_app, summary, pr_number) values (${SHA}, now(), ${USER}, true, 'test', 1)`,
  `insert into clients (id, name, kind) values (${CLIENT}, 'A client', 'client'), (${INTERNAL}, 'AVEL', 'internal')`,
];
const mission = (client: string, kind: string, clientKind: string) =>
  `insert into missions (client_id, kind, client_kind, budget_micros) values (${client}, '${kind}', '${clientKind}', 150000000)`;

describe("done-when 3: the CR-13 rules", () => {
  it("[done-when 3] a second internal client is refused, and any number of ordinary clients is not", () => {
    const { setupError, outcomes } = attempts(db(), base, [
      {
        label: "second_internal",
        sql: [`insert into clients (name, kind) values ('Another AVEL', 'internal')`],
      },
      {
        label: "second_client",
        sql: [`insert into clients (name, kind) values ('Another client', 'client')`],
      },
    ]);
    expect(setupError).toBeUndefined();
    const refused = outcomes.get("second_internal");
    expect(refused?.ok, "a second internal client is refused").toBe(false);
    expect(refused?.message).toContain('"clients_one_internal_uq"');
    expect(outcomes.get("second_client")?.ok, "a second ordinary client is fine").toBe(true);
  });

  it("[done-when 3] a client mission on the internal client is refused", () => {
    const { setupError, outcomes } = attempts(db(), base, [
      { label: "true_kind", sql: [mission(INTERNAL, "client", "internal")] },
      { label: "lying_kind", sql: [mission(INTERNAL, "client", "client")] },
      { label: "control", sql: [mission(CLIENT, "client", "client")] },
    ]);
    expect(setupError).toBeUndefined();
    expect(
      outcomes.get("true_kind")?.ok,
      "a client mission with the client's true kind (internal) is refused",
    ).toBe(false);
    expect(outcomes.get("true_kind")?.message).toContain('"missions_client_kind_match_ck"');
    expect(
      outcomes.get("lying_kind")?.ok,
      "claiming the internal client is an ordinary one is refused",
    ).toBe(false);
    expect(outcomes.get("lying_kind")?.message).toContain('"missions_client_kind_fk"');
    expect(
      outcomes.get("control")?.ok,
      `a client mission on a client is accepted: ${outcomes.get("control")?.message}`,
    ).toBe(true);
  });

  it("[done-when 3] an internal or a template mission on an ordinary client is refused", () => {
    const { setupError, outcomes } = attempts(db(), base, [
      { label: "internal_true", sql: [mission(CLIENT, "internal", "client")] },
      { label: "internal_lying", sql: [mission(CLIENT, "internal", "internal")] },
      { label: "template_true", sql: [mission(CLIENT, "template", "client")] },
      { label: "template_lying", sql: [mission(CLIENT, "template", "internal")] },
      { label: "internal_control", sql: [mission(INTERNAL, "internal", "internal")] },
      { label: "template_control", sql: [mission(INTERNAL, "template", "internal")] },
    ]);
    expect(setupError).toBeUndefined();
    for (const label of ["internal_true", "template_true"]) {
      expect(outcomes.get(label)?.ok, `${label} is refused`).toBe(false);
      expect(outcomes.get(label)?.message).toContain('"missions_client_kind_match_ck"');
    }
    for (const label of ["internal_lying", "template_lying"]) {
      expect(outcomes.get(label)?.ok, `${label} is refused`).toBe(false);
      expect(outcomes.get(label)?.message).toContain('"missions_client_kind_fk"');
    }
    for (const label of ["internal_control", "template_control"]) {
      expect(outcomes.get(label)?.ok, `${label} is accepted: ${outcomes.get(label)?.message}`).toBe(
        true,
      );
    }
  });

  it("[done-when 3] changing a mission's kind after onboarding starts is refused (honest path, every constraint in force)", () => {
    const { setupError, outcomes } = attempts(
      db(),
      [
        ...base,
        `insert into missions (id, client_id, kind, client_kind, budget_micros) values (${MISSION}, ${INTERNAL}, 'internal', 'internal', 150000000)`,
      ],
      [
        {
          label: "before_onboarding",
          sql: [`update missions set kind = 'template' where id = ${MISSION}`],
        },
        {
          label: "start_onboarding",
          sql: [
            `update missions set state = 'onboarding', onboarding_started_at = now(), factory_commit = ${SHA} where id = ${MISSION}`,
          ],
        },
        {
          label: "change_kind",
          sql: [`update missions set kind = 'internal' where id = ${MISSION}`],
        },
        {
          label: "other_column",
          sql: [`update missions set budget_micros = 1 where id = ${MISSION}`],
        },
      ],
    );
    expect(setupError).toBeUndefined();
    expect(
      outcomes.get("before_onboarding")?.ok,
      `kind can change before onboarding starts: ${outcomes.get("before_onboarding")?.message}`,
    ).toBe(true);
    expect(
      outcomes.get("start_onboarding")?.ok,
      `onboarding can start: ${outcomes.get("start_onboarding")?.message}`,
    ).toBe(true);
    expect(outcomes.get("change_kind")?.ok, "kind can't change after onboarding starts").toBe(
      false,
    );
    expect(
      outcomes.get("other_column")?.ok,
      `other columns still can: ${outcomes.get("other_column")?.message}`,
    ).toBe(true);
  });

  it("[done-when 3] the kind freeze runs through the missions_frozen trigger: with the match CHECK and the client-kind key dropped, only the trigger refuses, and without it the change goes through", () => {
    const { setupError, outcomes } = attempts(
      db(),
      [
        ...base,
        `alter table missions drop constraint "missions_client_kind_match_ck"`,
        `alter table missions drop constraint "missions_client_kind_fk"`,
        `insert into missions (id, client_id, kind, client_kind, budget_micros) values (${MISSION}, ${CLIENT}, 'client', 'client', 150000000)`,
        `update missions set state = 'onboarding', onboarding_started_at = now(), factory_commit = ${SHA} where id = ${MISSION}`,
        "set constraints all immediate",
      ],
      [
        {
          label: "with_trigger",
          sql: [`update missions set kind = 'internal' where id = ${MISSION}`],
        },
        {
          label: "trigger_off",
          sql: [
            `alter table missions disable trigger missions_frozen`,
            `update missions set kind = 'internal' where id = ${MISSION}`,
          ],
        },
      ],
    );
    expect(setupError, "the mission can be prepared").toBeUndefined();
    expect(outcomes.get("with_trigger")?.ok, "the trigger refuses the change").toBe(false);
    expect(
      outcomes.get("trigger_off")?.ok,
      `with the trigger off nothing else stops it: ${outcomes.get("trigger_off")?.message}`,
    ).toBe(true);
  });
});
