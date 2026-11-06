import { describe, expect, it } from "vitest";
import { databaseFromTarget, resolveDatabaseConfig, type TargetDatabase } from "./database";

const target: TargetDatabase = {
  kind: "neon",
  host: "ep-wandering-pine-a5l8s690-pooler.us-east-2.aws.neon.tech",
  port: 5432,
  dbname: "GoliathOmics",
  user: "neondb_owner",
  password: "secret:NEON_TEST_PASSWORD",
  sslmode: "require",
  channel_binding: "require",
  portal_role: { user: "goliath_portal", password: "secret:GOLIATH_PORTAL_DB_PASSWORD" },
};

describe("resolveDatabaseConfig", () => {
  it("prefers GOLIATH_DATABASE_URL over WF_DATABASE_URL and POSTGRES_*", () => {
    const resolved = resolveDatabaseConfig({
      GOLIATH_DATABASE_URL: "postgresql://portal:pw@db/GoliathOmics",
      WF_DATABASE_URL: "postgresql://other:pw@db/other",
      POSTGRES_HOST: "localhost",
      POSTGRES_DB: "methylpipeline",
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "x",
    });
    expect(resolved.connectionString).toBe("postgresql://portal:pw@db/GoliathOmics");
  });

  it("uses WF_DATABASE_URL and then the legacy METHYLPIPELINE_DB alias", () => {
    expect(resolveDatabaseConfig({ WF_DATABASE_URL: "postgresql://u:p@h/db" }).connectionString).toBe(
      "postgresql://u:p@h/db",
    );
    expect(resolveDatabaseConfig({ METHYLPIPELINE_DB: "postgresql://legacy:p@h/methylpipeline" }).connectionString).toBe(
      "postgresql://legacy:p@h/methylpipeline",
    );
  });

  it("builds the URL from POSTGRES_* including sslmode", () => {
    const resolved = resolveDatabaseConfig({
      POSTGRES_HOST: "localhost",
      POSTGRES_PORT: "5432",
      POSTGRES_DB: "GoliathOmics",
      POSTGRES_USER: "goliath_portal",
      POSTGRES_PASSWORD: "s3cret",
      POSTGRES_SSLMODE: "require",
    });
    expect(resolved.connectionString).toBe(
      "postgresql://goliath_portal:s3cret@localhost:5432/GoliathOmics?sslmode=require",
    );
    expect(resolved.ssl).toEqual({ rejectUnauthorized: false });
  });

  it("reads the goliath-test portal role and resolves its secret", () => {
    const resolved = databaseFromTarget(target, { GOLIATH_PORTAL_DB_PASSWORD: "from-env" });
    expect(resolved.connectionString).toContain("goliath_portal:from-env@");
    expect(resolved.connectionString).toContain("/GoliathOmics?");
    expect(resolved.connectionString).toContain("sslmode=require");
    expect(resolved.connectionString).not.toContain("channel_binding");
    expect(resolved.driver).toBe("neon");
    expect(resolved.connectionString).not.toContain("neondb_owner");
  });

  it("names the missing secret instead of inventing a database", () => {
    expect(() => resolveDatabaseConfig({}, target)).toThrow(/GOLIATH_PORTAL_DB_PASSWORD/);
  });
});
