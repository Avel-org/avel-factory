/**
 * The seed, run by hand on the host (Step 1 item 5): the one operator, from AVEL_OPERATOR_EMAIL
 * and AVEL_OPERATOR_PASSWORD, and AVEL's internal client (CR-13). Safe to run again: it never
 * changes the operator, and never makes a second one.
 *
 *   DATABASE_URL=… AVEL_OPERATOR_EMAIL=… AVEL_OPERATOR_PASSWORD=… pnpm --filter @avel/server seed
 */
import { fileURLToPath } from "node:url";
import { authAccounts, clients, users } from "@avel/db";
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

/** Better Auth's default minimum, which sign-in assumes. */
const MIN_PASSWORD_LENGTH = 8;

export interface SeedOptions {
  readonly databaseUrl: string;
  readonly email: string;
  readonly password: string;
}

export async function seedOperator(options: SeedOptions): Promise<void> {
  if (options.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`the operator's password needs at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  // Better Auth looks the email up lower-cased.
  const email = options.email.toLowerCase();
  const password = await hashPassword(options.password);
  const client = new pg.Client({ connectionString: options.databaseUrl });
  await client.connect();
  try {
    await drizzle(client).transaction(async (tx) => {
      // Two seeds at once take turns, so neither sees an empty users table the other is filling.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('avel.seed'))`);
      const existing = await tx.select({ email: users.email }).from(users);
      if (existing.length === 0) {
        const [user] = await tx
          .insert(users)
          .values({ name: "Operator", email })
          .returning({ id: users.id });
        if (user === undefined) throw new Error("the operator's insert returned no row");
        await tx
          .insert(authAccounts)
          .values({ userId: user.id, accountId: user.id, providerId: "credential", password });
      } else if (!existing.some((user) => user.email === email)) {
        throw new Error("an operator with another email exists; AVEL has one operator");
      }
      await tx
        .insert(clients)
        .values({ name: "AVEL", kind: "internal" })
        .onConflictDoNothing({ target: clients.kind, where: sql`kind = 'internal'` });
    });
  } finally {
    await client.end();
  }
}

const setting = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === "") throw new Error(`${name} is not set`);
  return value;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await seedOperator({
    databaseUrl: setting("DATABASE_URL"),
    email: setting("AVEL_OPERATOR_EMAIL"),
    password: setting("AVEL_OPERATOR_PASSWORD"),
  });
}
