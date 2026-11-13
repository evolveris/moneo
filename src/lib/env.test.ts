import { describe, expect, it } from "vitest";
import { parseDatabaseEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://user:s3cret@ep-example.neon.tech/neondb",
};

describe("parseDatabaseEnv", () => {
  it("returns the connection URL when the variable is set", () => {
    expect(parseDatabaseEnv(valid)).toEqual({ url: valid.DATABASE_URL });
  });

  it.each(["postgres://localhost/db", "postgresql://u:p@host/db"])(
    "accepts the URL %s",
    (url) => {
      expect(parseDatabaseEnv({ DATABASE_URL: url }).url).toBe(url);
    },
  );

  it("names DATABASE_URL when it is missing", () => {
    expect(() => parseDatabaseEnv({})).toThrow(
      "Missing environment variable DATABASE_URL",
    );
  });

  it("treats an empty string as missing", () => {
    expect(() => parseDatabaseEnv({ DATABASE_URL: "" })).toThrow(
      "Missing environment variable DATABASE_URL",
    );
  });

  it("rejects a URL that is not a Postgres address", () => {
    expect(() =>
      parseDatabaseEnv({ DATABASE_URL: "https://example.com" }),
    ).toThrow("DATABASE_URL must start with");
  });

  it("never puts a value in the error message", () => {
    expect(() =>
      parseDatabaseEnv({ DATABASE_URL: "https://example.com/s3cret" }),
    ).not.toThrow(/s3cret/);
  });
});
