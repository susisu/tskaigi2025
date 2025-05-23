/**
 * 非同期処理を含む計算を表す.
 * 通常はジェネレータ関数の戻り値として用いる.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Comp<T> = Generator<Promise<any>, T, any>;

/**
 * 非同期処理を含む計算を実行する.
 * @param comp 非同期処理を含む計算 (ジェネレータ)
 * @returns 計算結果の Promise
 */
export function run<T>(comp: Comp<T>): Promise<Awaited<T>> {
  /** ジェネレータ関数からの return をハンドル */
  function onReturn(value: T): Promise<Awaited<T>> {
    return Promise.resolve(value);
  }

  /** ジェネレータ関数からの throw をハンドル */
  function onThrow(error: unknown): Promise<Awaited<T>> {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  }

  /** ジェネレータ関数からの yield をハンドル */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onYield(promise: Promise<any>): Promise<Awaited<T>> {
    return promise.then(onFulfilled, onRejected);
  }

  /** Promise の成功 (fulfill) をハンドル */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onFulfilled(value?: any): Promise<Awaited<T>> {
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

  /** Promise の失敗 (reject) をハンドル */
  function onRejected(error: unknown): Promise<Awaited<T>> {
    let res;
    try {
      // ジェネレータ関数内の try ~ catch ~ finally が動作するよう throw を呼ぶ
      res = comp.throw(error);
    } catch (error) {
      return onThrow(error);
    }
    if (res.done) {
      return onReturn(res.value);
    }
    return onYield(res.value);
  }

  // 計算を先頭から開始
  return onFulfilled();
}

/**
 * Promise を AsyncComp に変換する.
 * `yield promise` の代わりに `yield* waitFor(promise)` とすることで正確な型が付けられる.
 */
export function* waitFor<T>(promise: Promise<T>): Comp<Awaited<T>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return yield promise;
}
