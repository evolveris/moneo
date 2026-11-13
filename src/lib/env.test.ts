import { describe, expect, it } from "vitest";
import { parseNeo4jEnv } from "./env";

const valid = {
  NEO4J_URI: "neo4j+s://abc123.databases.neo4j.io",
  NEO4J_USERNAME: "neo4j",
  NEO4J_PASSWORD: "s3cret",
};

describe("parseNeo4jEnv", () => {
  it("returns the connection details when all variables are set", () => {
    expect(parseNeo4jEnv(valid)).toEqual({
      uri: valid.NEO4J_URI,
      username: valid.NEO4J_USERNAME,
      password: valid.NEO4J_PASSWORD,
    });
  });

  it.each(["neo4j://localhost", "neo4j+s://x.io", "bolt://localhost:7687"])(
    "accepts the URI %s",
    (uri) => {
      expect(parseNeo4jEnv({ ...valid, NEO4J_URI: uri }).uri).toBe(uri);
    },
  );

  it.each(["NEO4J_URI", "NEO4J_USERNAME", "NEO4J_PASSWORD"])(
    "names %s when it is missing",
    (name) => {
      const env: Record<string, string | undefined> = { ...valid };
      delete env[name];
      expect(() => parseNeo4jEnv(env)).toThrow(
        `Missing environment variable ${name}`,
      );
    },
  );

  it("treats an empty string as missing", () => {
    expect(() => parseNeo4jEnv({ ...valid, NEO4J_PASSWORD: "" })).toThrow(
      "Missing environment variable NEO4J_PASSWORD",
    );
  });

  it("rejects a URI that is not a Neo4j address", () => {
    expect(() =>
      parseNeo4jEnv({ ...valid, NEO4J_URI: "https://example.com" }),
    ).toThrow("NEO4J_URI must start with");
  });

  it("never puts a value in the error message", () => {
    expect(() =>
      parseNeo4jEnv({ ...valid, NEO4J_URI: "https://example.com/s3cret" }),
    ).not.toThrow(/s3cret/);
  });
});
