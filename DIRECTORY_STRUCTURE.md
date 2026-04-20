# GACHI-CUBE Training Infrastructure

このドキュメントは、`training` ディレクトリ配下の構成とデプロイ設定をまとめています。

## ディレクトリ構成とURL対応

| ローカルディレクトリ | サーバーパス (`gachi-cube.com`) | 役割 |
| :--- | :--- | :--- |
| `training/` | `/training/` | **特訓ポータル (全体管理・入口)** |
| `training/pll/` | `/training/pll/` | **PLL Recognition Web** |
| `training/cross/` | `/training/cross/` | **Cross Practice Web** (開発予定) |

## 各プロジェクトのビルド方法

全てのプロジェクトは Vite を使用しており、それぞれのディレクトリで独立してビルドが可能です。

### 1. 特訓ポータル全体 (`training/`)
- `training/` ディレクトリで `npm run build` を実行。
- `/training/` パスをベースとして、共通の入口ページを生成します。

### 2. PLLアプリ (`training/pll/`)
- `pll/` ディレクトリで `npm run build` を実行。
- `/training/pll/` パスをベースとして、PLL特訓アプリを生成します。

### 3. Crossアプリ (`training/cross/`)
- `cross/` ディレクトリで `npm run build` を実行（予定）。
- `/training/cross/` パスをベースとして、クロス特訓アプリを生成します。

## デプロイ手順 (推奨)

各プロジェクトを統合して一つのサイトとして公開するための手順です。

1. **ポータルのビルド**: `training/` でビルドし、`dist/` を生成。
2. **PLLのビルド**: `training/pll/` でビルドし、生成された `dist/` の中身を、ポータルの `dist/pll/` フォルダへ移動します。
3. **Crossのビルド**: 同様にビルドし、ポータルの `dist/cross/` フォルダへ移動します。
4. **アップロード**: ポータル側の `dist/` フォルダを、サーバーの `/training/` となる場所にアップロードします。

## アプリ間ナビゲーション
- 各個別アプリ（PLL/Cross）のヘッダーおよびメニューには、共通して `/training/`（一階層上のポータル）へ戻るためのボタンが配置されています。
- これにより、ユーザーは複数の特訓ツールをスムーズに行き来することが可能です。
