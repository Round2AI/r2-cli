/** 轮询工具单元测试 */
import { describe, it, expect } from "vitest";
import { poll, sleep } from "../src/utils/polling.js";

describe("poll", () => {
  it("should return immediately when condition is met on first call", async () => {
    const result = await poll(() => Promise.resolve("done"), {
      condition: (v) => v === "done",
      interval: 100,
      timeout: 1000,
    });
    expect(result).toBe("done");
  });

  it("should retry until condition is met", async () => {
    let count = 0;
    const result = await poll(
      () => Promise.resolve(++count),
      { condition: (v) => v >= 3, interval: 10, timeout: 2000 },
    );
    expect(result).toBe(3);
  });

  it("should throw PollingError on timeout", async () => {
    await expect(
      poll(() => Promise.resolve("never"), {
        condition: () => false,
        interval: 10,
        timeout: 50,
      }),
    ).rejects.toThrow("轮询超时");
  });

  it("should abort on AbortSignal", { timeout: 10000 }, async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30);
    await expect(
      poll(() => Promise.resolve("never"), {
        condition: () => false,
        interval: 10,
        timeout: 5000,
      }, controller.signal),
    ).rejects.toThrow();
  });
});

describe("sleep", () => {
  it("should resolve after specified ms", async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });

  it("should abort on signal", async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10);
    await expect(sleep(5000, controller.signal)).rejects.toThrow();
  });
});
