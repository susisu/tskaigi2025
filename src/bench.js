/** パフォーマンス比較用のスクリプト */

/* eslint-disable no-console */
import perfHooks from "node:perf_hooks";

// N 個の数の合計を求める
const N = 10_000;
const arr = Array.from({ length: N }).map(() => Math.random());

function normalFunc() {
  let sum = 0;
  for (let i = 0; i < N; i++) {
    sum += arr[i];
  }
  return sum;
}

function* generatorFunc() {
  let sum = 0;
  for (let i = 0; i < N; i++) {
    sum += arr[i];
  }
  return sum;
}

// eslint-disable-next-line require-await
async function asyncFunc() {
  let sum = 0;
  for (let i = 0; i < N; i++) {
    sum += arr[i];
  }
  return sum;
}

function benchNormalFunc(numSamples) {
  const histogram = perfHooks.createHistogram();
  const perfFunc = perfHooks.performance.timerify(
    () => {
      normalFunc();
    },
    { histogram },
  );
  for (let i = 0; i < numSamples; i++) {
    perfFunc();
  }
  return histogram.toJSON();
}

function benchGeneratorFunc(numSamples) {
  const histogram = perfHooks.createHistogram();
  const perfFunc = perfHooks.performance.timerify(
    () => {
      generatorFunc().next();
    },
    { histogram },
  );
  for (let i = 0; i < numSamples; i++) {
    perfFunc();
  }
  return histogram.toJSON();
}

function benchAsyncFunc(numSamples) {
  const histogram = perfHooks.createHistogram();
  const perfFunc = perfHooks.performance.timerify(
    () => {
      asyncFunc();
    },
    { histogram },
  );
  for (let i = 0; i < numSamples; i++) {
    perfFunc();
  }
  return histogram.toJSON();
}

/** JIT による最適化を待つために捨てるサンプル数 */
const NUM_WARMUPS = 1_000;
/** パフォーマンス計測に使うサンプル数 */
const NUM_SAMPLES = 10_000;

benchNormalFunc(NUM_WARMUPS);
console.log("normal", benchNormalFunc(NUM_SAMPLES));

benchGeneratorFunc(NUM_WARMUPS);
console.log("generator", benchGeneratorFunc(NUM_SAMPLES));

benchAsyncFunc(NUM_WARMUPS);
console.log("async", benchAsyncFunc(NUM_SAMPLES));
