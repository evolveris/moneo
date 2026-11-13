import { z } from "zod";

const missing = (name: string) =>
  `Missing environment variable ${name}. See .env.example.`;

const databaseEnvSchema = z.object({
  DATABASE_URL: z
    .string(missing("DATABASE_URL"))
    .min(1, missing("DATABASE_URL"))
    .regex(
      /^postgres(ql)?:\/\//,
      "DATABASE_URL must start with postgres:// or postgresql://",
    ),
});

export type DatabaseEnv = {
  url: string;
};

// Messages name the variable but never include its value, so a secret cannot
// end up in a log.
export function parseDatabaseEnv(
  env: Record<string, string | undefined>,
): DatabaseEnv {
  const result = databaseEnvSchema.safeParse(env);
  if (!result.success) {
    throw new Error(
      result.error.issues.map((issue) => issue.message).join(" "),
    );
  }
  return { url: result.data.DATABASE_URL };
}
