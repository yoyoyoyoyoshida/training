import type { CommunityApp } from '../models/CommunityApp';

/**
 * コミュニティ作品リポジトリのインターフェース
 * 依存性逆転の原則（DIP）に従い、データ永続化・取得の実装詳細を抽象化
 */
export interface ICommunityAppRepository {
    /** 登録されている全作品の一覧を取得する */
    getAll(): Promise<CommunityApp[]>;

    /** アプリIDを指定して単一作品を取得する */
    findById(id: string): Promise<CommunityApp | null>;

    /** カテゴリ指定による作品の絞り込み */
    findByCategory(category: string): Promise<CommunityApp[]>;

    /** キーワードによるタイトル・説明文の全文検索 */
    search(query: string): Promise<CommunityApp[]>;
}
