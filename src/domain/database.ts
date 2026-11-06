/**
 * Same connection rules as GoliathOmics:
 * workers/methyl_worker/platform_env.py and deploy/env/README.md.
 * A full URL wins. Otherwise POSTGRES_*. Otherwise the goliath-test target,
 * whose password is a secret:NAME reference, not a value in git.
 */

export type DbEnv = Record<string, string | undefined>;

export type TargetDatabase = {
  kind?: string;
  host?: string;
  schema_host?: string;
  port?: number;
  dbname?: string;
  user?: string;
  password?: string;
  sslmode?: string;
  channel_binding?: string;
  portal_role?: { user?: string; password?: string };
};

export type ResolvedDatabase = {
  connectionString: string;
  driver: "neon" | "pg";
  ssl?: { rejectUnauthorized: boolean };
};

const URL_KEYS = ["GOLIATH_DATABASE_URL", "WF_DATABASE_URL", "METHYLPIPELINE_DB"] as const;

export function resolveDatabaseConfig(env: DbEnv, target?: TargetDatabase | null): ResolvedDatabase {
  const override = first(env, URL_KEYS);
  if (override) {
    return {
      connectionString: override,
      driver: driverFor(hostOf(override), undefined),
      ssl: sslFor(sslModeOf(override)),
    };
  }

  const fromEnv = fromPostgresEnv(env);
  if (fromEnv) return fromEnv;

  if (target) return fromTarget(target, env);

  throw new Error(
    "Set GOLIATH_DATABASE_URL, or POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, and POSTGRES_PASSWORD. " +
      "The goliath-test target uses secret:GOLIATH_PORTAL_DB_PASSWORD.",
  );
}

export function databaseFromTarget(target: TargetDatabase, env: DbEnv): ResolvedDatabase {
  return fromTarget(target, env);
}

function fromPostgresEnv(env: DbEnv): ResolvedDatabase | null {
  const host = env.POSTGRES_HOST?.trim();
  const database = env.POSTGRES_DB?.trim();
  const user = env.POSTGRES_USER?.trim();
  const password = env.POSTGRES_PASSWORD?.trim();
  if (!host && !database && !user && !password) return null;
  if (!host || !database || !user || !password) {
    throw new Error("POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, and POSTGRES_PASSWORD are all required.");
  }
  return build({
    host,
    port: env.POSTGRES_PORT?.trim() || "5432",
    database,
    user,
    password,
    sslmode: env.POSTGRES_SSLMODE?.trim(),
    channelBinding: env.POSTGRES_CHANNEL_BINDING?.trim(),
    kind: host.endsWith("neon.tech") ? "neon" : undefined,
  });
}

function fromTarget(target: TargetDatabase, env: DbEnv): ResolvedDatabase {
  const role = target.portal_role;
  const user = role?.user?.trim() || target.user?.trim();
  const password = resolveSecret(role?.password ?? target.password, env);
  const host = target.host?.trim();
  const database = target.dbname?.trim();
  if (!host || !database || !user || !password) {
    const missing = role?.password?.startsWith("secret:")
      ? role.password
      : target.password?.startsWith("secret:")
        ? target.password
        : "secret:GOLIATH_PORTAL_DB_PASSWORD";
    throw new Error(`unset ${missing} (GoliathOmics deploy/targets/goliath-test.json).`);
  }
  return build({
    host,
    port: String(target.port ?? 5432),
    database,
    user,
    password,
    sslmode: target.sslmode ?? (target.kind === "neon" ? "require" : undefined),
    channelBinding: target.channel_binding,
    kind: target.kind,
  });
}

function resolveSecret(raw: string | undefined, env: DbEnv): string {
  const value = raw?.trim() ?? "";
  if (!value.startsWith("secret:")) return value;
  const name = value.slice("secret:".length);
  return env[name]?.trim() ?? "";
}

function build(parts: {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  sslmode?: string;
  channelBinding?: string;
  kind?: string;
}): ResolvedDatabase {
  const driver = driverFor(parts.host, parts.kind);
  const user = encodeURIComponent(parts.user);
  const password = encodeURIComponent(parts.password);
  const database = encodeURIComponent(parts.database);
  const params = new URLSearchParams();
  if (parts.sslmode) params.set("sslmode", parts.sslmode);
  // channel_binding is for libpq (psql, gateway). The Neon JS driver speaks TLS itself.
  if (driver === "pg" && parts.channelBinding) params.set("channel_binding", parts.channelBinding);
  const query = params.toString();
  return {
    connectionString: `postgresql://${user}:${password}@${parts.host}:${parts.port}/${database}${query ? `?${query}` : ""}`,
    driver,
    ssl: driver === "pg" ? sslFor(parts.sslmode) : undefined,
  };
}

function driverFor(host: string, kind: string | undefined): "neon" | "pg" {
  if (kind === "neon" || host.endsWith("neon.tech")) return "neon";
  return "pg";
}

function hostOf(connectionString: string): string {
  try {
    return new URL(connectionString).hostname;
  } catch {
    return "";
  }
}

function first(env: DbEnv, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function sslModeOf(connectionString: string): string | undefined {
  try {
    return new URL(connectionString).searchParams.get("sslmode") ?? undefined;
  } catch {
    return undefined;
  }
}

function sslFor(mode: string | undefined): { rejectUnauthorized: boolean } | undefined {
  if (!mode || mode === "disable" || mode === "allow" || mode === "prefer") return undefined;
  if (mode === "verify-ca" || mode === "verify-full") return { rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}
