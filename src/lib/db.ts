import "server-only";
import { neon } from "@neondatabase/serverless";
import { parseDatabaseEnv } from "./env";

// The Neon serverless driver sends each query over HTTP, so there is no
// connection pool to keep and nothing to reuse across hot reloads. A new client
// per call is cheap, and it gives every call its own timeout.
export function getSql() {
  const { url } = parseDatabaseEnv(process.env);
  return neon(url, {
    // Fail fast instead of waiting, but long enough for Neon to wake up after
    // being idle.
    fetchOptions: { signal: AbortSignal.timeout(10_000) },
  });
}
