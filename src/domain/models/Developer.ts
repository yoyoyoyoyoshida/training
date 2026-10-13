/**
 * 開発者（クリエイター）プロフィールのドメインエンティティ
 * UI表示やポップオーバー、モーダル内で使用する開発者の情報表現
 */
export interface DeveloperProfile {
    /** 開発者名またはハンドルネーム */
    readonly name: string;
    /** アイコン内に表示するイニシャル短縮文字（例: ST, YG） */
    readonly iconText: string;
    /** キューブ歴（例: "キューブ歴 5年"） */
    readonly cubeExperience: string;
    /** 自己紹介・実績などのbio文 */
    readonly bio: string;
    /** 審査通過作品数 */
    readonly approvedAppCount: number;
    /** 公式SNSまたはチャンネルのURL（任意） */
    readonly snsUrl?: string;
}
