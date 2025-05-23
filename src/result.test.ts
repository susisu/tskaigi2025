import { describe, it, expect, vi } from "vitest";
import type { Comp } from "./result.ts";
import { run, ok, err } from "./result.ts";

describe("run", () => {
  it("ジェネレータから yield された Result が ok ならその位置から再開する", () => {
    function* myFunc(): Comp<number, never> {
      const a = yield* ok(1);
      const b = yield* ok(2);
      return a + b;
    }
    const res = run(myFunc());
    expect(res).toEqual(ok(3));
  });

  it("ジェネレータから yield された Result が err ならその位置で専用のエラーを throw する", () => {
    const onCatch = vi.fn((_err: unknown) => {});
    function* myFunc(): Comp<number, "ERROR"> {
      const a = yield* ok(1);
      let b: number;
      try {
        b = yield* err("ERROR" as const);
      } catch (err) {
        onCatch(err);
        return 0;
      }
      return a + b;
    }
    const res = run(myFunc());
    expect(res).toEqual(ok(0));
    expect(onCatch).toHaveBeenCalled();
  });

  it("ジェネレータから専用のエラーが throw されたら中断して err を返す", () => {
    function* myFunc(): Comp<number, "ERROR"> {
      const a = yield* ok(1);
      const b: number = yield* err("ERROR" as const);
      return a + b;
    }
    const res = run(myFunc());
    expect(res).toEqual(err("ERROR"));
  });

  it("ジェネレータから通常のエラーが throw されたらそのまま throw する", () => {
    function* myFunc(): Comp<number, never> {
      throw new Error("ERROR");
    }
    expect(() => {
      run(myFunc());
    }).toThrowError(new Error("ERROR"));
  });
});
