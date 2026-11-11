import "server-only"
import neo4j, { type Driver } from "neo4j-driver"

// One driver (a connection pool) per server instance. In development, hot
// reload re-runs this module, so the driver is kept on globalThis to avoid
// opening a new pool on every edit.
const globalForNeo4j = globalThis as unknown as { neo4jDriver?: Driver }

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`)
  }
  return value
}

export function getDriver(): Driver {
  if (!globalForNeo4j.neo4jDriver) {
    globalForNeo4j.neo4jDriver = neo4j.driver(
      requireEnv("NEO4J_URI"),
      neo4j.auth.basic(requireEnv("NEO4J_USERNAME"), requireEnv("NEO4J_PASSWORD")),
      // Fail fast (for example when Aura is paused) instead of waiting 60s.
      { connectionTimeout: 10_000, connectionAcquisitionTimeout: 10_000 },
    )
  }
  return globalForNeo4j.neo4jDriver
}
