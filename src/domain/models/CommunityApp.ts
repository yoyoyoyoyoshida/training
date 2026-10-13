import type { DeveloperProfile } from './Developer';

/**
 * アプリの実行ソース定義（URLまたはインラインHTML文書）
 * 開放閉鎖の原則（OCP）に基づき、実行媒体の種別を型安全に表現
 */
export type AppExecutionSource =
    | { readonly type: 'url'; readonly url: string }
    | { readonly type: 'doc'; readonly doc: string };

/**
 * コミュニティ作品（Webアプリ/特訓ツール）のドメインエンティティ
 */
export interface CommunityApp {
    /** 一意な識別子（例: app-sample） */
    readonly id: string;
    /** アプリの表示名 */
    readonly name: string;
    /** カテゴリ識別子（例: sim, finger） */
    readonly category: string;
    /** 画面表示用のカテゴリラベル（例: 特訓ツール） */
    readonly categoryLabel: string;
    /** アプリの特徴・概要説明文 */
    readonly description: string;
    /** テーマアクセントカラー（HEXコード） */
    readonly accentColor: string;
    /** 開発者プロフィール */
    readonly developer: DeveloperProfile;
    /** アプリの実行ソース */
    readonly executionSource: AppExecutionSource;
}
