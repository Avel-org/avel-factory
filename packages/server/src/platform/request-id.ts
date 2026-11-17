import { Context } from "effect";

/** The current request's ID, provided to every program that runs through `effectHandler`. */
export class RequestId extends Context.Service<RequestId, string>()("avel/RequestId") {}
