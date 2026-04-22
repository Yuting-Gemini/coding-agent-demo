# FF17 Sandbox — レイドサンドボックスポータル雛形

`scenario: k8s-sandbox-portal` 用の React + TypeScript + Vite 雛形。

バトルプランナーが「ボス × 開始フェーズ × 装備レベル」を指定して、
即座にレイド戦闘環境を立ち上げられる、FF シリーズの世界観に合った
**ダーク基調 UI** のサンドボックスを生成するための土台。

## 想定ユースケース

- バトルプランナーが対象ボスとフェーズ、装備条件を選ぶ
- 起動ボタンで K8s API に Pod を作成
- Pending → Running をポーリング監視
- Running になったら接続先 IP/Port を表示し、Slack に通知

## 既存の雛形構成

```
ff17-sandbox/
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
└── src/
    ├── main.tsx           # エントリーポイント
    ├── App.tsx            # ポータルのトップレベル枠
    ├── index.css          # CSS リセット + ダークテーマの基本適用
    ├── theme.ts           # FF 風ダーク (黒紫 + シアン) テーマトークン
    ├── api.ts             # Cloud Run K8s モック叩く fetch ラッパー
    └── components/
        ├── Select.tsx     # 共通プルダウン (ダーク版)
        └── StatusIndicator.tsx # Pod 状態 (Pending/Running/Error) 表示
```

## モックサーバー

ローカル開発時もデモ時も、両方とも Cloud Run 上の同じモックを叩く:

```
ベース URL: https://coding-agent-demo-mock-258509337164.us-central1.run.app
K8s API:
  GET    /api/v1/namespaces/{ns}/pods                # Pod 一覧
  POST   /api/v1/namespaces/{ns}/pods                # Pod 作成
  GET    /api/v1/namespaces/{ns}/pods/{name}         # Pod 状態
  DELETE /api/v1/namespaces/{ns}/pods/{name}         # Pod 削除
```

`src/api.ts` に既にこのベース URL がハードコードされている。
本番接続に切り替える場合は `import.meta.env.VITE_K8S_BASE_URL` で上書き可能。

## デザイン原則 (FF 風)

- **ダーク基調**: 黒〜深い紫の背景
- **アクセントカラー**: シアン / マゼンタ系のネオン光
- **ゴシック様式の余白**: 余白多め、装飾控えめ
- **ステータスは光で表現**: Running は鮮やかに、Pending はくすませる

色トークンは `src/theme.ts` を参照。コンポーネントから `theme.color.xxx` で参照する。

## 開発

```bash
npm install
npm run dev   # http://localhost:5173
```

## Coding Agent への指示

新規ポータル機能を追加するときは、以下の原則に従うこと:

1. **`theme.ts` の色トークンを必ず使う** (ハードコード禁止)
2. **`api.ts` の fetch ラッパーを使う** (生 `fetch` を直接呼ばない)
3. **`components/` の共通部品を優先利用** (Select / StatusIndicator 等)
4. **ドメインルールは TypeScript 型 + UI 両方で防ぐ** (フェーズが無いボスで第2/3を選べない等)
5. **長時間ジョブは必ずポーリング + ステータス可視化**
6. **副作用 (Slack 通知等) は単一関数に集約** (`src/notify.ts` 等)
