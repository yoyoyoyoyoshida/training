import type { CommunityApp } from '../../../domain/models/CommunityApp';
import type { ICommunityAppRepository } from '../../../domain/repositories/ICommunityAppRepository';

/**
 * コミュニティ作品カタログ一覧モーダル制御クラス
 */
export class CatalogModal {
    private readonly modalElem: HTMLElement | null;
    private readonly gridElem: HTMLElement | null;
    private readonly searchInputElem: HTMLInputElement | null;
    private readonly emptyNoticeElem: HTMLElement | null;
    private readonly closeBtnElem: HTMLElement | null;
    private currentCategory: string = 'all';

    private onPlayAppCallback?: (appId: string) => void;

    constructor(private readonly repository: ICommunityAppRepository) {
        this.modalElem = document.getElementById('catalog-modal');
        this.gridElem = document.getElementById('catalogGrid');
        this.searchInputElem = document.getElementById('catalogSearchInput') as HTMLInputElement | null;
        this.emptyNoticeElem = document.getElementById('catalogEmptyNotice');
        this.closeBtnElem = document.getElementById('catalogModalClose');

        this.bindEvents();
    }

    public setOnPlayApp(callback: (appId: string) => void): void {
        this.onPlayAppCallback = callback;
    }

    private bindEvents(): void {
        if (this.closeBtnElem) {
            this.closeBtnElem.addEventListener('click', () => this.close());
        }

        if (this.modalElem) {
            this.modalElem.addEventListener('click', (e) => {
                if (e.target === this.modalElem) {
                    this.close();
                }
            });
        }

        if (this.searchInputElem) {
            this.searchInputElem.addEventListener('input', () => {
                void this.renderGrid();
            });
        }

        // カテゴリタブのクリック制御
        const tabs = document.querySelectorAll<HTMLElement>('.catalog-filter-tab');
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.cat || 'all';
                this.selectCategory(category, tab);
            });
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    public isOpen(): boolean {
        return this.modalElem?.classList.contains('is-open') ?? false;
    }

    public async open(): Promise<void> {
        if (!this.modalElem) return;

        if (this.searchInputElem) {
            this.searchInputElem.value = '';
        }
        this.currentCategory = 'all';

        // タブのアクティブ状態を初期化
        document.querySelectorAll('.catalog-filter-tab').forEach((tab) => {
            tab.classList.toggle('is-active', (tab as HTMLElement).dataset.cat === 'all');
        });

        await this.renderGrid();
        this.modalElem.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    public close(): void {
        if (!this.modalElem) return;

        this.modalElem.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    public selectCategory(category: string, activeTab?: HTMLElement): void {
        this.currentCategory = category;
        document.querySelectorAll('.catalog-filter-tab').forEach((tab) => {
            tab.classList.remove('is-active');
        });

        if (activeTab) {
            activeTab.classList.add('is-active');
        }

        void this.renderGrid();
    }

    public async renderGrid(): Promise<void> {
        if (!this.gridElem) return;

        const query = this.searchInputElem ? this.searchInputElem.value.trim() : '';
        let apps: CommunityApp[];

        if (query) {
            apps = await this.repository.search(query);
            if (this.currentCategory !== 'all') {
                apps = apps.filter((a) => a.category === this.currentCategory);
            }
        } else if (this.currentCategory !== 'all') {
            apps = await this.repository.findByCategory(this.currentCategory);
        } else {
            apps = await this.repository.getAll();
        }

        this.gridElem.innerHTML = '';

        if (this.emptyNoticeElem) {
            this.emptyNoticeElem.style.display = apps.length === 0 ? 'block' : 'none';
        }

        for (const app of apps) {
            const card = this.createCardElement(app);
            this.gridElem.appendChild(card);
        }
    }

    private createCardElement(app: CommunityApp): HTMLElement {
        const card = document.createElement('div');
        card.className = 'catalog-card-item';
        card.innerHTML = `
            <div class="catalog-card-top">
                <div class="catalog-card-icon" style="background: linear-gradient(135deg, ${app.accentColor}22, #0b1120); border-color: ${app.accentColor}44;">
                    <span style="color:${app.accentColor}; font-weight:900; font-size:1.1rem; font-family:var(--mono);">${app.developer.iconText}</span>
                </div>
                <div class="catalog-card-info">
                    <h4 class="catalog-card-title">${app.name}</h4>
                    <span class="catalog-card-author">作者: <strong>${app.developer.name}</strong>（${app.developer.cubeExperience}）</span>
                </div>
            </div>
            <p class="catalog-card-desc">${app.description}</p>
            <div class="catalog-card-footer">
                <span class="catalog-card-tag">${app.categoryLabel}</span>
                <button type="button" class="catalog-card-play-btn" data-app-id="${app.id}">
                    <span>遊ぶ</span>
                    <span style="font-size:0.75rem;">▷</span>
                </button>
            </div>
        `;

        const playBtn = card.querySelector<HTMLButtonElement>('.catalog-card-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.close();
                setTimeout(() => {
                    this.onPlayAppCallback?.(app.id);
                }, 120);
            });
        }

        return card;
    }
}
