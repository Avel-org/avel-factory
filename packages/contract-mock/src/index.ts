/**
 * `@avel/contract-mock`: the contract mock for routes 52 to 54 (UI contract section 2),
 * routes 19 and 8 for the shell (shell-layout.md section 4), and CR-W31 part (a)'s routes over
 * a mission the routes walk from draft to release (`mock.seedMission`).
 * Only the dev server under `AVEL_API=mock` and the tests import it, never a production build.
 */
export { fixtures } from "#fixtures";
export {
  createMock,
  type MissionStage,
  MOCK_OPERATOR_ID,
  type Mock,
  type MockFailure,
  type MockRoute,
  type RecordedRequest,
} from "#mock";
export type { SeedRow } from "#rows";
export * as world from "#world";
