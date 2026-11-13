import { connection } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  // Always run at request time, never during the build.
  await connection();
  try {
    await getSql()`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch (error) {
    // The details stay in the server log, never in the response.
    console.error("Health check failed:", error);
    return Response.json({ status: "error" }, { status: 503 });
  }
}
