import { describe, it, expect, vi } from "vitest";
import { run } from "./async_js.js";

describe("run", () => {
  it("ジェネレータから yield された Promise が fulfill されたらその位置から再開する", async () => {
    function* myFunc() {
      const a = yield Promise.resolve(1);
      const b = yield Promise.resolve(2);
      return a + b;
    }
    const promise = run(myFunc());
    await expect(promise).resolves.toEqual(3);
  });

  it("ジェネレータから yield された Promise が reject されたらその位置で throw する", async () => {
    const onCatch = vi.fn(() => {});
    function* myFunc() {
      const a = yield Promise.resolve(1);
      let b;
      try {
        b = yield Promise.reject(new Error("ERROR"));
      } catch (err) {
        onCatch(err);
        return 0;
      }
      return a + b;
    }
    const promise = run(myFunc());
    await expect(promise).resolves.toEqual(0);
    expect(onCatch).toHaveBeenCalledWith(new Error("ERROR"));
  });

  it("ジェネレータからエラーが throw されたら reject された Promise を返す", async () => {
    function* myFunc() {
      throw new Error("ERROR");
    }
    const promise = run(myFunc());
    await expect(promise).rejects.toThrow(new Error("ERROR"));
  });
});
