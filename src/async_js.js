/**
 * 非同期処理を含む計算を実行する.
 * @param {Generator} comp 非同期処理を含む計算 (ジェネレータ)
 * @returns 計算結果の Promise
 */
export function run(comp) {
  /** ジェネレータ関数からの return をハンドル */
  function onReturn(value) {
    return Promise.resolve(value);
  }

  /** ジェネレータ関数からの throw をハンドル */
  function onThrow(error) {
    return Promise.reject(error);
  }

  /** ジェネレータ関数からの yield をハンドル */
  function onYield(promise) {
    return promise.then(onFulfilled, onRejected);
  }

  /** Promise の成功 (fulfill) をハンドル */
  function onFulfilled(value) {
    let res;
    try {
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
  function onRejected(error) {
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
