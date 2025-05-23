/* eslint-disable func-style, default-case, @typescript-eslint/consistent-return, @typescript-eslint/no-unnecessary-condition */
/* eslint-disable no-console */

import type { Eff, Interpreter } from "@susisu/effectful";
import { interpret, perform, runAsync, runPure, waitFor } from "@susisu/effectful";
import * as fs from "node:fs/promises";

// エフェクトを定義
// interface の宣言マージを利用して EffectRegistry<T> の定義を拡張する
declare module "@susisu/effectful" {
  interface EffectRegistry<T> {
    net: {
      type: "httpGet";
      url: URL;
      c: (x: string) => T;
    };
    fs: {
      type: "writeFile";
      filename: string;
      data: string;
      c: (x: void) => T;
    };
  }
}

// エフェクトのコンストラクタを用意 (便利なので)

function httpGet(url: string | URL): Eff<string, "net"> {
  return perform({
    key: "net",
    data: {
      type: "httpGet",
      url: new URL(url),
      c: (x) => x,
    },
  });
}

function writeFile(filename: string, data: string): Eff<void, "fs"> {
  return perform({
    key: "fs",
    data: {
      type: "writeFile",
      filename,
      data,
      c: (x) => x,
    },
  });
}

// メインの処理
function* main(): Eff<void, "net" | "fs"> {
  const icon = yield* httpGet("https://susisu.ch/icon.svg");
  yield* writeFile("./icon.svg", icon);
}

// 本番用のインタプリタを作成
// 実際にネットワークリクエストやファイルの読み書きを行う

const interpretNet: Interpreter<"net", "async"> = function* (effect) {
  switch (effect.data.type) {
    case "httpGet": {
      const res = yield* waitFor(fetch(effect.data.url));
      const data = yield* waitFor(res.text());
      return effect.data.c(data);
    }
  }
};

const interpretFs: Interpreter<"fs", "async"> = function* (effect) {
  switch (effect.data.type) {
    case "writeFile": {
      yield* waitFor(fs.writeFile(effect.data.filename, effect.data.data, "utf-8"));
      return effect.data.c(undefined);
    }
  }
};

// 本番実行

runAsync(
  interpret(main(), {
    net: interpretNet,
    fs: interpretFs,
  }),
).catch((err: unknown) => {
  console.error(err);
});

// テスト用のインタプリタを作成
// コンソールにログを出して動作の様子を確認できるようにする

const mockNet: Interpreter<"net", never> = function* (effect) {
  switch (effect.data.type) {
    case "httpGet": {
      console.log(`HTTP GET: ${effect.data.url.toString()}`);
      return effect.data.c("DUMMY");
    }
  }
};

const mockFs: Interpreter<"fs", never> = function* (effect) {
  switch (effect.data.type) {
    case "writeFile": {
      console.log(`Write file: ${effect.data.filename}\n${effect.data.data}`);
      return effect.data.c(undefined);
    }
  }
};

// テスト実行

runPure(
  interpret(main(), {
    net: mockNet,
    fs: mockFs,
  }),
);
