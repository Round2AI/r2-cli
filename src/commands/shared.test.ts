import { describe, it, expect, vi } from "vitest";
import { jsonAction } from "./shared.js";

describe("jsonAction", () => {
  it("should call fn and pass through options", async () => {
    const fn = vi.fn();
    const wrapped = jsonAction(fn);
    await wrapped({ json: false });
    expect(fn).toHaveBeenCalledOnce();
  });

  it("should output JSON error when fn throws and options.json is true", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    const wrapped = jsonAction(async () => {
      throw new Error("test error");
    });

    await expect(wrapped({ json: true })).rejects.toThrow("exit");
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({ success: false, error: "test error", errorType: "unknown" }),
    );

    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("should call handleCommandError when fn throws and options.json is false", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    const wrapped = jsonAction(async () => {
      throw new Error("test error");
    });

    // handleCommandError calls process.exit(1)
    await expect(wrapped({ json: false })).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
