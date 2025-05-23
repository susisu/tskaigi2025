/** 処理の結果 (成功 (ok) または失敗 (err)) を表す */
export type Result<T, E> = Ok<T> | Err<E>;

/** 処理の成功を表す class */
export class Ok<T> {
  readonly isOk: true = true as const;
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  *[Symbol.iterator](): Comp<T, never> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return yield this;
  }
}

/** 処理の失敗を表す class */
export class Err<E> {
  readonly isOk: false = false as const;
  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  *[Symbol.iterator](): Comp<never, E> {
    // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
    return (yield this) as never;
  }
}

/** `new Ok(value)` のエイリアス */
export function ok<T>(value: T): Ok<T> {
  return new Ok(value);
}

/** `new Err(error)` のエイリアス */
export function err<E>(error: E): Err<E> {
  return new Err(error);
}

/**
 * 失敗し得る処理を含む計算を表す.
 * 通常はジェネレータ関数の戻り値として用いる.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Comp<T, E> = Generator<Result<any, E>, T, any>;

/**
 * 失敗し得る処理を含む計算を実行する
 * @param comp 失敗し得る処理を含む計算 (ジェネレータ)
 * @returns 計算結果
 */
export function run<T, E>(comp: Comp<T, E>): Result<T, E> {
  // NOTE: 末尾呼び出し最適化が行われない環境では再帰関数ではなくループで書いた方が良い

  /**
   * Result の失敗による中断専用のエラー.
   * onThrow でその他のエラーと区別するために必要.
   */
  class SafeError extends Error {
    error: E;
    constructor(error: E) {
      super(String(error));
      this.name = "SafeError";
      this.error = error;
    }
  }

  /** ジェネレータ関数からの return をハンドル */
  function onReturn(value: T): Result<T, E> {
    return ok(value);
  }

  /** ジェネレータ関数からの throw をハンドル */
  function onThrow(error: unknown): Result<T, E> {
    if (error instanceof SafeError) {
      return err(error.error);
    } else {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw error;
    }
  }

  /** ジェネレータ関数からの yield をハンドル */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onYield(res: Result<any, E>): Result<T, E> {
    return res.isOk ? onOk(res.value) : onErr(res.error);
  }

  /** Result の成功 (ok) をハンドル */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onOk(value?: any): Result<T, E> {
    let res;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      res = comp.next(value);
    } catch (error) {
      return onThrow(error);
    }
    if (res.done) {
      return onReturn(res.value);
    }
    return onYield(res.value);
  }

  /** Result の失敗 (err) をハンドル */
  function onErr(error: E): Result<T, E> {
    let res;
    try {
      // ジェネレータ関数内の try ~ catch ~ finally が動作するよう throw を呼ぶ
      res = comp.throw(new SafeError(error));
    } catch (error) {
      return onThrow(error);
    }
    if (res.done) {
      return onReturn(res.value);
    }
    return onYield(res.value);
  }

  // 計算を先頭から開始
  return onOk();
}
