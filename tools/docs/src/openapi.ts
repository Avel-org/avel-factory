// openapi.json: the OpenAPI document generated from the contract's 102 routes
// (contract.md section 2), through oRPC's generator and its Zod 4 converter.
// Routes outside the contract (/api/auth/*, the GitHub webhook, git) aren't in it (Q6).
import * as api from "@avel/contract";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import * as core from "zod/v4/core";
import { cmp } from "./schema.ts";

export const openapiInfo = {
  title: "AVEL API",
  version: "0.0.0",
  description:
    "Generated from `@avel/contract` by `pnpm --filter @avel/docs generate`. Don't edit it by hand.",
};

type JsonSchema = Record<string, unknown>;

/**
 * Every exported DTO (a Zod schema named `...Dto`), as a named component the operations
 * point at, instead of a copy inlined in each one. Inputs stay inline: oRPC splits them
 * into path, query and body parameters.
 */
function dtoComponents() {
  const common: Record<string, { schema: core.$ZodType; strategy: "output" }> = {};
  for (const [name, value] of Object.entries(api)) {
    if (name.endsWith("Dto") && value instanceof core.$ZodType) {
      common[name] = { schema: value, strategy: "output" };
    }
  }
  return common;
}

/**
 * The error body as the contract puts it on the wire (contract.md section 5; `ErrorBody`):
 * `{ code, message, details?, requestId }`, with `details` the code's typed data. oRPC's
 * default body (`defined`, `status`, `data`) isn't what the server sends (Step 1 item 2.9).
 * Each code is one component, `Error_<CODE>`; a response lists the codes of its status.
 */
function errorBodies() {
  const components = new Map<string, JsonSchema>();
  const shape = (
    definedErrors: [code: string, message: string, dataRequired: boolean, data: JsonSchema][],
  ) => {
    const refs = definedErrors.map(([code, message, dataRequired, data]) => {
      const name = `Error_${code}`;
      const hasDetails = Object.keys(data).length > 0;
      const body: JsonSchema = {
        type: "object",
        properties: {
          code: { const: code },
          message: { type: "string", default: message },
          ...(hasDetails ? { details: data } : {}),
          requestId: { type: "string", description: "Matches the X-Request-Id header" },
        },
        required: [
          "code",
          "message",
          ...(hasDetails && dataRequired ? ["details"] : []),
          "requestId",
        ],
      };
      const seen = components.get(name);
      if (seen && JSON.stringify(seen) !== JSON.stringify(body)) {
        throw new Error(`${code} has two different bodies`);
      }
      components.set(name, body);
      return { $ref: `#/components/schemas/${name}` };
    });
    return refs.length === 1 ? refs[0] : { oneOf: refs };
  };
  return { components, shape };
}

export async function renderOpenapi(): Promise<string> {
  const generator = new OpenAPIGenerator({ schemaConverters: [new ZodToJsonSchemaConverter()] });
  const errors = errorBodies();
  const doc = await generator.generate(api.contract, {
    info: openapiInfo,
    commonSchemas: dtoComponents(),
    customErrorResponseBodySchema: (definedErrors) =>
      errors.shape(definedErrors as [string, string, boolean, JsonSchema][]),
  });
  const schemas: Record<string, unknown> = { ...(doc.components?.schemas ?? {}) };
  for (const [name, body] of errors.components) {
    if (name in schemas) throw new Error(`a DTO is already named ${name}`);
    schemas[name] = body;
  }
  const sorted = Object.fromEntries(Object.entries(schemas).sort(([a], [b]) => cmp(a, b)));
  doc.components = {
    ...doc.components,
    schemas: sorted as NonNullable<typeof doc.components>["schemas"],
  };
  return `${JSON.stringify(doc, null, 2)}\n`;
}
