import type { CommunityApp } from '../../../domain/models/CommunityApp';
import type { ICommunityAppRepository } from '../../../domain/repositories/ICommunityAppRepository';

/**
 * 安全な iframe サンドボックスプレイヤー モーダル制御クラス
 * 単一責任の原則（SRP）に基づき、プレイヤーモーダルのライフサイクルとレンダリングのみを担当
 */
export class AppPlayerModal {
    private readonly modalElem: HTMLElement | null;
    private readonly titleElem: HTMLElement | null;
    private readonly creatorNameElem: HTMLElement | null;
    private readonly creatorExpElem: HTMLElement | null;
    private readonly creatorBioElem: HTMLElement | null;
    private readonly iframeElem: HTMLIFrameElement | null;
    private readonly closeBtnElem: HTMLElement | null;
    private readonly reloadBtnElem: HTMLElement | null;

    constructor(private readonly repository: ICommunityAppRepository) {
        this.modalElem = document.getElementById('player-modal');
        this.titleElem = document.getElementById('modal-app-name');
        this.creatorNameElem = document.getElementById('modal-creator-info');
        this.creatorExpElem = document.getElementById('modal-creator-exp');
        this.creatorBioElem = document.getElementById('modal-creator-bio');
        this.iframeElem = document.getElementById('modal-iframe') as HTMLIFrameElement | null;
        this.closeBtnElem = document.getElementById('modal-close-btn');
        this.reloadBtnElem = document.getElementById('modal-reload-btn');

        this.bindEvents();
    }

    private bindEvents(): void {
        if (this.closeBtnElem) {
            this.closeBtnElem.addEventListener('click', () => this.close());
        }

        if (this.reloadBtnElem) {
            this.reloadBtnElem.addEventListener('click', () => this.reload());
        }

        if (this.modalElem) {
            this.modalElem.addEventListener('click', (e) => {
                if (e.target === this.modalElem) {
                    this.close();
                }
            });
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    public isOpen(): boolean {
        return this.modalElem?.classList.contains('is-open') ?? false;
    }

    public async open(appId: string): Promise<void> {
        const app = await this.repository.findById(appId);
        if (!app || !this.modalElem) {
            return;
        }

        this.renderAppInfo(app);
        this.renderExecutionSource(app);

        this.modalElem.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    public close(): void {
        if (!this.modalElem) return;

        this.modalElem.classList.remove('is-open');
        document.body.style.overflow = '';

        if (this.iframeElem) {
            this.iframeElem.removeAttribute('srcdoc');
            this.iframeElem.src = 'about:blank';
        }
    }

    public reload(): void {
        if (!this.iframeElem) return;

        if (this.iframeElem.src && this.iframeElem.src !== 'about:blank') {
            const currentSrc = this.iframeElem.src;
            this.iframeElem.src = 'about:blank';
            setTimeout(() => {
                if (this.iframeElem) this.iframeElem.src = currentSrc;
            }, 100);
        } else if (this.iframeElem.srcdoc) {
            const currentDoc = this.iframeElem.srcdoc;
            this.iframeElem.srcdoc = '';
            setTimeout(() => {
                if (this.iframeElem) this.iframeElem.srcdoc = currentDoc;
            }, 100);
        }
    }

    private renderAppInfo(app: CommunityApp): void {
        if (this.titleElem) this.titleElem.textContent = app.name;
        if (this.creatorNameElem) this.creatorNameElem.textContent = app.developer.name;
        if (this.creatorExpElem) this.creatorExpElem.textContent = app.developer.cubeExperience;
        if (this.creatorBioElem) this.creatorBioElem.textContent = app.developer.bio;
    }

    private renderExecutionSource(app: CommunityApp): void {
        if (!this.iframeElem) return;

        if (app.executionSource.type === 'url') {
            this.iframeElem.removeAttribute('srcdoc');
            this.iframeElem.src = app.executionSource.url;
        } else {
            this.iframeElem.removeAttribute('src');
            this.iframeElem.srcdoc = app.executionSource.doc;
        }
    }
}
