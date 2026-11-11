import "server-only"
import neo4j, { type Driver } from "neo4j-driver"
import { parseNeo4jEnv } from "./env"

// One driver (a connection pool) per server instance. In development, hot
// reload re-runs this module, so the driver is kept on globalThis to avoid
// opening a new pool on every edit.
const globalForNeo4j = globalThis as unknown as { neo4jDriver?: Driver }

export function getDriver(): Driver {
  if (!globalForNeo4j.neo4jDriver) {
    const { uri, username, password } = parseNeo4jEnv(process.env)
    globalForNeo4j.neo4jDriver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      // Fail fast (for example when Aura is paused) instead of waiting 60s.
      { connectionTimeout: 10_000, connectionAcquisitionTimeout: 10_000 },
    )
  }
  return globalForNeo4j.neo4jDriver
}
