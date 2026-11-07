// The data core's public surface (UI contract section 3). Modules import the data core only
// through this file (Frontend Map v0.6, What every module looks like): named exports only.
export {
  type Api,
  type ApiClient,
  type ApiContext,
  type ApiOptions,
  apiFor,
  bindApi,
  createApi,
  createApiClient,
  useApi,
} from "./client";
export {
  BUILT_CONTRACT_VERSION,
  type ContractMismatch,
  useContractMismatch,
} from "./contract-version";
export { ApiError, decodeErrorBody, NetworkError, toUiError, type UiError } from "./errors";
export { newIdempotencyKey } from "./idempotency";
export {
  CostImpact,
  DecisionChoice,
  type ParsedPage,
  PendingDecisionRow,
  type PendingPage,
  parsePendingPage,
  selectPendingPages,
} from "./pending-decisions";
export { createQueryClient } from "./query";
