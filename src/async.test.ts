import { describe, it, expect, vi } from "vitest";
import type { Comp } from "./async.ts";
import { run, waitFor } from "./async.ts";

describe("run", () => {
  it("ジェネレータから yield された Promise が fulfill されたらその位置から再開する", async () => {
    function* myFunc(): Comp<number> {
      const a = yield* waitFor(Promise.resolve(1));
      const b = yield* waitFor(Promise.resolve(2));
      return a + b;
    }
    const promise = run(myFunc());
    await expect(promise).resolves.toEqual(3);
  });

  it("ジェネレータから yield された Promise が reject されたらその位置で throw する", async () => {
    const onCatch = vi.fn((_err: unknown) => {});
    function* myFunc(): Comp<number> {
      const a = yield* waitFor(Promise.resolve(1));
      let b: number;
      try {
        b = yield* waitFor(Promise.reject(new Error("ERROR")));
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
    function* myFunc(): Comp<number> {
      throw new Error("ERROR");
    }
    const promise = run(myFunc());
    await expect(promise).rejects.toThrow(new Error("ERROR"));
  });
});
