import { connection } from "next/server"
import { getDriver } from "@/lib/neo4j"

export async function GET() {
  // Always run at request time, never during the build.
  await connection()
  try {
    await getDriver().executeQuery("RETURN 1 AS ok")
    return Response.json({ status: "ok" })
  } catch (error) {
    // The details stay in the server log, never in the response.
    console.error("Health check failed:", error)
    return Response.json({ status: "error" }, { status: 503 })
  }
}
