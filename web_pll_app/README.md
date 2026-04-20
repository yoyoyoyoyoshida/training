# PLL Recognition Web App

TypeScript + Vite ポート。Flutter 版「PLL 認識アプリ」の主要フロー（ホーム、練習、確認テスト、タイムアタック、復習、プロフィール、ランキング、お知らせ）を React/React Router 上で再構成しています。学習状況やスコアはブラウザの `localStorage` に保存され、AdMob の代わりに Google AdSense を利用できます。

## セットアップ

```bash
cd web_pll_app
npm install
npm run dev
```

初回実行は `npm install` にネットワークアクセスが必要です。`npm run dev` で `http://localhost:5173` を起動します。

## 環境変数

以下を `.env` または `.env.local` に設定してください。

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
```

* Firebase を設定しない場合、ランキング・お知らせ画面はプレースホルダー表示になります。
* AdSense を設定しない場合、広告枠にはダミーの案内が表示されます。

## 主なフォルダー

| パス | 内容 |
| --- | --- |
| `src/data` | PLL データとアセットパス定義 |
| `src/utils` | localStorage ラッパー、進捗/スコア/プロフィール管理、Firebase 初期化など |
| `src/store` | 最新プレイ結果を保持する Zustand ストア |
| `src/pages` | 各画面の React コンポーネント |
| `public/assets` | Flutter 版から移植した画像・音声アセット |

## 実装済みフロー

- ホーム: 学習進捗・ハイスコア表示と各機能への導線
- 練習メニュー: 名前学習 / 確認テスト / タイムアタック
- 名前を覚える: 2D 図カード + 学習ステータス表示
- 確認テスト: 21 問ランダム出題、結果を復習リストへ保存
- タイムアタック: 色モード切り替え、カウントダウン、60 秒挑戦、スコア記録
- 復習: 直近の誤答リスト表示・クリアボタン
- プロフィール: プレイヤー名、学習状況リセット、統計
- ランキング: Firebase 連携（設定時）＋ローカルベストの fallback
- お知らせ: Firestore 連携（設定時）
- Google AdSense: 共通コンポーネントで差し替え可能な広告枠

## テストと拡張のヒント

- 主要ロジックはユニットテストをまだ用意していません。`vitest` を組み込み、データ／ユーティリティ層から追加すると安全です。
- Firebase 認証や匿名ログイン、ランキング投稿 API は未移植のため、必要に応じて SDK を追加してください。
- UI はレスポンシブ対応済みですが、モバイル最適化や国際化が今後の改善ポイントです。
