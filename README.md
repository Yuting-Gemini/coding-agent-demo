# coding-agent-demo

Coding Agent (Vertex AI Agent Engine `coding-agent`) のデモ用リポジトリ。

PdM Agent → GitHub Issue Agent → Coding Agent のチェーンで自動実装される、
ゲーム開発スタジオ向け社内ポータル 2 種類の Vite + React + TypeScript 雛形を含む。

## ディレクトリ構成

| パス | シナリオ | 用途 |
| --- | --- | --- |
| [`dq13-portal/`](./dq13-portal) | `scenario: jenkins-qa-portal` | DQ13 マスターデータ × アセット組合せ QA セルフサービス (Jenkins 連携・シンプル明朗 UI) |
| [`ff17-sandbox/`](./ff17-sandbox) | `scenario: k8s-sandbox-portal` | FF17 ボス × フェーズ × デバフ レイドサンドボックス (Kubernetes 連携・ダーク UI) |

## モックサーバー

両シナリオとも Cloud Run 上のデモモックを叩く前提:

- ベース URL: `https://coding-agent-demo-mock-258509337164.us-central1.run.app`
- Jenkins: `/api/json`, `/job/{name}/api/json`, `/job/{name}/buildWithParameters`
- K8s: `/api/v1/namespaces/{ns}/pods` (CRUD)
- Preview Deploy: `POST /preview`, `GET /preview/{deployment_id}`

Coding Agent 側の環境変数 `JENKINS_MOCK_URL` / `K8S_MOCK_URL` / `PREVIEW_DEPLOY_URL` に上記 URL が設定済み。

## 使い方 (Issue から PR 自動生成)

1. PRD Agent (Gemini Enterprise) で要望を PRD 化
2. Issue Agent でこのリポジトリに Issue 起票 (本文に `実装先: dq13-portal/` などを明示)
3. Coding Agent (Agent Engine) が Issue を読み、対応サブディレクトリ配下に実装 → PR 作成
