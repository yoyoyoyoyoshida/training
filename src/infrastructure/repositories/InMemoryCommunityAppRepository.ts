import type { CommunityApp } from '../../domain/models/CommunityApp';
import type { ICommunityAppRepository } from '../../domain/repositories/ICommunityAppRepository';

/**
 * メモリ内データソースによるコミュニティ作品リポジトリ実装
 * 単体テストでのモック利用および初期クライアントサイドレンダリングに対応
 */
export class InMemoryCommunityAppRepository implements ICommunityAppRepository {
    private readonly apps: Map<string, CommunityApp>;

    constructor(initialApps?: CommunityApp[]) {
        const defaultApps: CommunityApp[] = [
            {
                id: 'app-sample',
                name: 'サンプルアプリ',
                category: 'sim',
                categoryLabel: '特訓ツール',
                description: '30秒前後の人向けの、F2Lの先読みや裏読みの練習に特化したアプリです。',
                accentColor: '#0284c7',
                developer: {
                    name: 'サンプル太郎',
                    iconText: 'ST',
                    cubeExperience: 'キューブ歴 5年',
                    bio: 'キューブ歴5年。\n大会は数回しか出たことがありませんが、自己ベストは25秒です。ゆるく活動しています。得意な種目は、目隠しルービックキューブです。',
                    approvedAppCount: 1,
                    snsUrl: 'https://www.youtube.com/channel/UC32YALYq9U4bbg6W1zGqqSQ',
                },
                executionSource: {
                    type: 'doc',
                    doc: `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><style>body{margin:0;padding:2rem;background:#090a10;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;}.card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:18px;padding:2rem;max-width:440px;width:100%;text-align:center;}.badge{display:inline-block;padding:0.25rem 0.65rem;border-radius:20px;background:rgba(2,132,199,0.2);color:#38bdf8;font-size:0.75rem;font-weight:bold;margin-bottom:0.8rem;}h1{font-size:1.35rem;margin:0 0 0.8rem;}.cube{width:120px;height:120px;margin:1.5rem auto;background:linear-gradient(135deg,#0284c7,#10b981);border-radius:16px;display:flex;align-items:center;justify-content:center;animation:rot 6s infinite linear;}@keyframes rot{0%{transform:perspective(400px) rotateX(20deg) rotateY(0deg);}100%{transform:perspective(400px) rotateX(20deg) rotateY(360deg);}}button{padding:0.75rem 1.4rem;border-radius:10px;border:none;background:#0284c7;color:#fff;font-weight:bold;cursor:pointer;}</style></head><body><div class="card"><div class="badge">SAMPLE APP DEMO</div><h1>F2L 先読み・裏読み特訓</h1><p style="font-size:0.85rem;color:#aaa;">30秒前後の人向けの、F2Lの先読みや裏読みの練習に特化したアプリです。</p><div class="cube"><svg width="54" height="54" viewBox="0 0 48 48" fill="none"><path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="#fff" stroke-width="2"/><path d="M24 4L42 14L24 24L6 14L24 4Z" fill="#fff" fill-opacity="0.3"/><path d="M6 14L24 24V44L6 34V14Z" fill="#fff" fill-opacity="0.1"/><path d="M42 14L24 24V44L42 34V14Z" fill="#fff" fill-opacity="0.2"/></svg></div><p style="font-size:0.85rem;color:#38bdf8;">開発者: サンプル太郎（自己ベスト 25秒）</p><button onclick="alert('サンプルアプリのデモが正常に動作しています')">特訓セッション開始</button></div></body></html>`,
                },
            },
        ];

        const list = initialApps ?? defaultApps;
        this.apps = new Map(list.map((app) => [app.id, app]));
    }

    async getAll(): Promise<CommunityApp[]> {
        return Array.from(this.apps.values());
    }

    async findById(id: string): Promise<CommunityApp | null> {
        return this.apps.get(id) ?? null;
    }

    async findByCategory(category: string): Promise<CommunityApp[]> {
        if (!category || category === 'all') {
            return this.getAll();
        }
        return Array.from(this.apps.values()).filter((app) => app.category === category);
    }

    async search(query: string): Promise<CommunityApp[]> {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return this.getAll();
        }
        return Array.from(this.apps.values()).filter((app) => {
            const inName = app.name.toLowerCase().includes(normalized);
            const inDesc = app.description.toLowerCase().includes(normalized);
            const inDev = app.developer.name.toLowerCase().includes(normalized);
            return inName || inDesc || inDev;
        });
    }
}
