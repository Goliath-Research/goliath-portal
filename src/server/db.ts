import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool as PgPool } from "pg";
import { resolveDatabaseConfig, type TargetDatabase } from "@/domain/database";

type QueryPool = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

let pool: QueryPool | null = null;

export function getPool(): QueryPool {
  if (pool) return pool;
  const resolved = resolveDatabaseConfig(process.env, readGoliathTestTarget());
  if (resolved.driver === "neon") {
    pool = new NeonPool({ connectionString: resolved.connectionString });
  } else {
    pool = new PgPool({
      connectionString: resolved.connectionString,
      ssl: resolved.ssl,
    });
  }
  return pool;
}

export async function queryRows<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

function readGoliathTestTarget(): TargetDatabase | null {
  const explicit = process.env.GOLIATH_TARGET_FILE?.trim();
  const candidates = [
    explicit,
    process.env.GOLIATH_OMICS_ROOT
      ? path.join(process.env.GOLIATH_OMICS_ROOT, "deploy/targets/goliath-test.json")
      : undefined,
    path.resolve(process.cwd(), "../GoliathOmics/deploy/targets/goliath-test.json"),
  ].filter((item): item is string => Boolean(item));

  for (const file of candidates) {
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as { database?: TargetDatabase };
      if (parsed.database?.host && parsed.database.dbname) return parsed.database;
    } catch {
      continue;
    }
  }
  return null;
}
