import { describe, expect, it } from "vitest";
import { getAppMode } from "./appMode";

describe("getAppMode", () => {
  it.each(["demo", "user"])("reads %s", (value) => {
    expect(getAppMode({ APP_MODE: value })).toBe(value);
  });

  it.each([undefined, "", "USER", "admin", " user"])(
    "falls back to demo for %j",
    (value) => {
      expect(getAppMode({ APP_MODE: value })).toBe("demo");
    },
  );
});
