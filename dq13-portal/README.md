# DQ13 Portal — QA セルフサービスポータル雛形

`scenario: jenkins-qa-portal` 用の React + TypeScript + Vite 雛形。

QA / デバッガーが Jenkins ジョブをブラウザから操作してテスト環境を即座に立てる、
DQ シリーズの世界観に合った **シンプル明朗 UI** のポータルを生成するための土台。

## 想定ユースケース

- QA リードが「マスターデータのリビジョン × アセットブランチ」をプルダウンで選ぶ
- 「環境構築」ボタンで Jenkins の `buildWithParameters` を起動
- 進捗をプログレスバーで可視化
- 完了したら接続先 URL を表示

## 既存の雛形構成

```
dq13-portal/
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
└── src/
    ├── main.tsx           # エントリーポイント
    ├── App.tsx            # ポータルのトップレベル枠
    ├── App.css            # 全体スタイル
    ├── index.css          # CSS リセット + テーマ変数の適用
    ├── theme.ts           # DQ 風シンプル明朗テーマトークン
    ├── api.ts             # Cloud Run モック叩く fetch ラッパー
    └── components/
        ├── Select.tsx     # 共通プルダウン
        └── ProgressBar.tsx # 共通プログレスバー
```

## モックサーバー

ローカル開発時もデモ時も、両方とも Cloud Run 上の同じモックを叩く:

```
ベース URL: https://coding-agent-demo-mock-258509337164.us-central1.run.app
Jenkins API:
  GET  /api/json                            # ジョブ一覧
  GET  /job/{name}/api/json                 # ジョブ詳細 (パラメータ定義)
  POST /job/{name}/buildWithParameters      # ビルド起動
  GET  /job/{name}/{buildNumber}/api/json   # ビルド状態
```

`src/api.ts` に既にこのベース URL がハードコードされている。
本番接続に切り替える場合は `import.meta.env.VITE_JENKINS_BASE_URL` で上書き可能。

## デザイン原則 (DQ 風)

- **明朗な配色**: 白基調 + 青系アクセント
- **太めのボーダー / 角丸**: ファミコン感を残しつつ現代風に
- **読みやすいフォント**: システムフォント中心、コードは monospace
- **エラー / 警告は赤系で目立たせる**

色トークンは `src/theme.ts` を参照。コンポーネントから `theme.color.primary` 等で参照する。

## 開発

```bash
npm install
npm run dev   # http://localhost:5173
```

## Coding Agent への指示

新規ポータル機能を追加するときは、以下の原則に従うこと:

1. **`theme.ts` の色トークンを必ず使う** (ハードコード禁止)
2. **`api.ts` の fetch ラッパーを使う** (生 `fetch` を直接呼ばない)
3. **`components/` の共通部品を優先利用** (Select / ProgressBar 等)
4. **ドメインルールは TypeScript 型 + UI 両方で防ぐ** (組合せ不正で送信ボタン disabled)
5. **長時間ジョブは必ずポーリング + プログレスバー表示**
