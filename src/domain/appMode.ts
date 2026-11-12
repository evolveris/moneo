import { z } from "zod"

const modeSchema = z.enum(["demo", "user"])

export type Mode = z.infer<typeof modeSchema>

// The one place the mode is read. Anything missing or unrecognised is demo,
// so the public deployment can never end up in user mode by accident.
export function getAppMode(
  env: Record<string, string | undefined> = process.env,
): Mode {
  const result = modeSchema.safeParse(env.APP_MODE)
  return result.success ? result.data : "demo"
}
