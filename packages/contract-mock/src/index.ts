/**
 * `@avel/contract-mock`: the contract mock for routes 52 to 54 (UI contract section 2).
 * Only the dev server under `AVEL_API=mock` and the tests import it, never a production build.
 */
export { fixtures } from "./fixtures.js";
export {
  createMock,
  MOCK_OPERATOR_ID,
  type Mock,
  type MockFailure,
  type MockRoute,
  type RecordedRequest,
} from "./mock.js";
export type { SeedRow } from "./rows.js";
