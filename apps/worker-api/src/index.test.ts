import { describe, expect, it, vi } from "vitest";
import app from "./index";

describe("worker-api", () => {
  it("returns Hello World at the root", async () => {
    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ message: "Hello World!" });
  });

  it("provides a health check", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("checks the database through the DB binding", async () => {
    const first = vi.fn().mockResolvedValue({ connected: 1 });
    const prepare = vi.fn().mockReturnValue({ first });
    const env = { DB: { prepare } } as unknown as Env;
    const response = await app.request("/db-check", undefined, env);

    expect(prepare).toHaveBeenCalledWith("SELECT 1 AS connected");
    expect(first).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("does not report a healthy database without the expected result", async () => {
    const first = vi.fn().mockResolvedValue(null);
    const prepare = vi.fn().mockReturnValue({ first });
    const env = { DB: { prepare } } as unknown as Env;
    const response = await app.request("/db-check", undefined, env);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
  });

  it("returns JSON for unknown routes", async () => {
    const response = await app.request("/missing");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not Found" });
  });
});
