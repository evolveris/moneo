import { z } from "zod";

const missing = (name: string) =>
  `Missing environment variable ${name}. See .env.example.`;

const neo4jEnvSchema = z.object({
  NEO4J_URI: z
    .string(missing("NEO4J_URI"))
    .min(1, missing("NEO4J_URI"))
    .regex(
      /^(neo4j|bolt)(\+s|\+ssc)?:\/\//,
      "NEO4J_URI must start with neo4j://, neo4j+s://, bolt:// or bolt+s://",
    ),
  NEO4J_USERNAME: z
    .string(missing("NEO4J_USERNAME"))
    .min(1, missing("NEO4J_USERNAME")),
  NEO4J_PASSWORD: z
    .string(missing("NEO4J_PASSWORD"))
    .min(1, missing("NEO4J_PASSWORD")),
});

export type Neo4jEnv = {
  uri: string;
  username: string;
  password: string;
};

// Messages name the variable but never include its value, so a secret cannot
// end up in a log.
export function parseNeo4jEnv(
  env: Record<string, string | undefined>,
): Neo4jEnv {
  const result = neo4jEnvSchema.safeParse(env);
  if (!result.success) {
    throw new Error(
      result.error.issues.map((issue) => issue.message).join(" "),
    );
  }
  const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = result.data;
  return { uri: NEO4J_URI, username: NEO4J_USERNAME, password: NEO4J_PASSWORD };
}
