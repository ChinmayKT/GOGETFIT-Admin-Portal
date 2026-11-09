import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadEnv } from "vite";
import { resolveApiBaseUrl, resolveApiConfig, resolveMediaBaseUrl } from "./config";

const root = resolve(__dirname, "../..");

describe("resolveApiBaseUrl", () => {
  it("falls back to same-origin /api when unset or blank", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("/api");
    expect(resolveApiBaseUrl("   ")).toBe("/api");
  });

  it("appends the backend /api prefix to a bare server origin", () => {
    expect(resolveApiBaseUrl("http://localhost:3000")).toBe("http://localhost:3000/api");
    expect(resolveApiBaseUrl("http://13.233.157.200:3000/")).toBe("http://13.233.157.200:3000/api");
  });

  it("keeps a URL or path that already names its API path", () => {
    expect(resolveApiBaseUrl("http://localhost:3000/api/")).toBe("http://localhost:3000/api");
    expect(resolveApiBaseUrl("/api")).toBe("/api");
  });
});

describe("resolveMediaBaseUrl", () => {
  it("prefers an explicit VITE_MEDIA_BASE_URL", () => {
    expect(resolveMediaBaseUrl("https://cdn.example.com/", "http://localhost:3000/api")).toBe("https://cdn.example.com");
  });

  it("uses the API server's origin when the API URL is absolute", () => {
    expect(resolveMediaBaseUrl(undefined, "http://13.233.157.200:3000/api")).toBe("http://13.233.157.200:3000");
  });

  it("stays on the portal's own origin when the API is proxied same-origin", () => {
    expect(resolveMediaBaseUrl(undefined, "/api")).toBe("");
  });
});

describe("environment selection", () => {
  // loadEnv reads the same .env.<mode> files Vite uses for `vite` and `vite build --mode <mode>`.
  const configFor = (mode: string) => resolveApiConfig(loadEnv(mode, root, "VITE_"));

  it("development targets the local backend", () => {
    expect(configFor("development")).toEqual({
      apiBaseUrl: "http://localhost:3000/api",
      mediaBaseUrl: "http://localhost:3000",
    });
  });

  it("staging targets the AWS staging backend", () => {
    expect(configFor("staging")).toEqual({
      apiBaseUrl: "http://13.233.157.200:3000/api",
      mediaBaseUrl: "http://13.233.157.200:3000",
    });
  });

  it("the committed mode files define only public VITE_API_BASE_URL values", () => {
    for (const file of [".env.development", ".env.staging"]) {
      const keys = readFileSync(resolve(root, file), "utf8")
        .split("\n")
        .filter((line) => line.trim() && !line.trim().startsWith("#"))
        .map((line) => line.split("=")[0].trim());
      expect(keys).toEqual(["VITE_API_BASE_URL"]);
    }
  });
});
