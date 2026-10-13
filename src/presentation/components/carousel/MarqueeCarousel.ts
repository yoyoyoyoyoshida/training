import { MarqueeCalculator } from './MarqueeCalculator';

export interface MarqueeCarouselOptions {
    readonly onPlayApp?: (appId: string) => void;
    readonly onSubmitApp?: () => void;
}

/**
 * コミュニティカルーセル制御クラス
 * シームレス無限自動スクロール、ドラッグ操作、ボタン操作、カード選択イベントを一括管理
 */
export class MarqueeCarousel {
    private readonly wrapper: HTMLElement | null;
    private readonly track: HTMLElement | null;
    private readonly prevBtn: HTMLElement | null;
    private readonly nextBtn: HTMLElement | null;

    private loopDistance: number = 0;
    private hasDragged: boolean = false;
    private isDragging: boolean = false;
    private startX: number = 0;
    private scrollStartLeft: number = 0;

    private isUserInteracting: boolean = false;
    private autoScrollRaf: number | null = null;
    private lastTimestamp: number = 0;
    private resumeTimeout: ReturnType<typeof setTimeout> | null = null;

    private static readonly SCROLL_SPEED_PX_PER_SEC = 36;
    private static readonly SHIFT_STEP_PX = 380;
    private static readonly RESUME_DELAY_MS = 2200;

    constructor(private readonly options: MarqueeCarouselOptions = {}) {
        this.wrapper = document.getElementById('communityMarqueeWrapper');
        this.track = document.getElementById('communityMarqueeTrack');
        this.prevBtn = document.getElementById('communitySliderPrev');
        this.nextBtn = document.getElementById('communitySliderNext');

        if (this.wrapper && this.track) {
            this.init();
        }
    }

    private init(): void {
        this.updateLoopDistance();
        this.bindEvents();

        // DOMレイアウト確定後に正確な幅を取得して自動スクロール開始
        setTimeout(() => {
            this.updateLoopDistance();
            this.startAutoScroll();
        }, 100);
    }

    private updateLoopDistance(): void {
        if (!this.track) return;
        const groups = this.track.querySelectorAll<HTMLElement>('.community-marquee-group');
        if (groups.length >= 2) {
            this.loopDistance = groups[1].offsetLeft - groups[0].offsetLeft;
        } else {
            this.loopDistance = 0;
        }
    }

    private checkSeamlessLoop(): void {
        if (!this.wrapper || this.loopDistance <= 0) return;

        if (this.wrapper.scrollLeft >= this.loopDistance) {
            this.wrapper.scrollLeft -= this.loopDistance;
        } else if (this.wrapper.scrollLeft <= 0) {
            this.wrapper.scrollLeft += this.loopDistance;
        }
    }

    private bindEvents(): void {
        if (!this.wrapper) return;

        window.addEventListener('resize', () => {
            this.updateLoopDistance();
        });

        // 左右ボタン操作
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.pauseAutoScrollTemporarily();
                this.wrapper?.scrollBy({ left: -MarqueeCarousel.SHIFT_STEP_PX, behavior: 'smooth' });
            });
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.pauseAutoScrollTemporarily();
                this.wrapper?.scrollBy({ left: MarqueeCarousel.SHIFT_STEP_PX, behavior: 'smooth' });
            });
        }

        // マウスクリック＆ドラッグ操作
        this.wrapper.addEventListener('mousedown', (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('a') || target?.closest('.community-app-card__dev-wrap')) {
                return;
            }

            this.isDragging = true;
            this.hasDragged = false;
            this.wrapper?.classList.add('is-dragging');
            this.startX = e.pageX - (this.wrapper?.offsetLeft ?? 0);
            this.scrollStartLeft = this.wrapper?.scrollLeft ?? 0;
            this.pauseAutoScroll();
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.wrapper?.classList.remove('is-dragging');
                this.resumeAutoScrollAfterDelay();
            }
        });

        this.wrapper.addEventListener('mousemove', (e: MouseEvent) => {
            if (!this.isDragging || !this.wrapper) return;

            const x = e.pageX - this.wrapper.offsetLeft;
            const walk = (x - this.startX) * 1.5;
            if (Math.abs(walk) > 6) {
                this.hasDragged = true;
            }
            e.preventDefault();
            this.wrapper.scrollLeft = this.scrollStartLeft - walk;
            this.checkSeamlessLoop();
        });

        this.wrapper.addEventListener('scroll', () => {
            if (this.isDragging || this.isUserInteracting) {
                this.checkSeamlessLoop();
            }
        });

        // ホバーおよびタッチによる一時停止
        this.wrapper.addEventListener('mouseenter', () => this.pauseAutoScroll());
        this.wrapper.addEventListener('mouseleave', () => {
            if (!this.isDragging) this.resumeAutoScrollAfterDelay();
        });
        this.wrapper.addEventListener('touchstart', () => this.pauseAutoScroll(), { passive: true });
        this.wrapper.addEventListener('touchend', () => this.resumeAutoScrollAfterDelay(), { passive: true });

        // カードクリック・キーボード操作のイベント委譲
        this.wrapper.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // リンククリックまたは開発者ポップオーバーエリア内のクリックは除外
            if (target.closest('a')) {
                return;
            }
            if (target.closest('.community-app-card__dev-wrap')) {
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
                return;
            }

            if (this.hasDragged) {
                this.hasDragged = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            const playCard = target.closest<HTMLElement>('.community-app-card');
            if (playCard) {
                const appId = playCard.dataset.appId;
                if (appId) {
                    this.options.onPlayApp?.(appId);
                }
                return;
            }

            const moreCard = target.closest<HTMLElement>('.community-app-card--more');
            if (moreCard) {
                this.options.onSubmitApp?.();
            }
        });

        // キーボード操作対応
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof HTMLElement) {
                if (e.target.classList.contains('community-app-card')) {
                    if (e.target.closest('.community-app-card__dev-wrap')) return;
                    e.preventDefault();
                    const appId = e.target.getAttribute('data-app-id');
                    if (appId) this.options.onPlayApp?.(appId);
                } else if (e.target.classList.contains('community-app-card--more')) {
                    e.preventDefault();
                    this.options.onSubmitApp?.();
                }
            }
        });
    }

    private startAutoScroll(): void {
        if (!this.autoScrollRaf) {
            this.lastTimestamp = performance.now();
            this.autoScrollRaf = requestAnimationFrame((now) => this.autoScrollStep(now));
        }
    }

    private autoScrollStep(now: number): void {
        const delta = (now - this.lastTimestamp) / 1000;
        this.lastTimestamp = now;

        if (!this.isUserInteracting && !this.isDragging && this.loopDistance > 0 && this.wrapper) {
            this.wrapper.scrollLeft += MarqueeCarousel.SCROLL_SPEED_PX_PER_SEC * delta;
            this.checkSeamlessLoop();
        }

        this.autoScrollRaf = requestAnimationFrame((n) => this.autoScrollStep(n));
    }

    private pauseAutoScroll(): void {
        this.isUserInteracting = true;
        if (this.resumeTimeout) {
            clearTimeout(this.resumeTimeout);
            this.resumeTimeout = null;
        }
    }

    private pauseAutoScrollTemporarily(): void {
        this.pauseAutoScroll();
        this.resumeAutoScrollAfterDelay();
    }

    private resumeAutoScrollAfterDelay(): void {
        if (this.resumeTimeout) {
            clearTimeout(this.resumeTimeout);
        }
        this.resumeTimeout = setTimeout(() => {
            this.isUserInteracting = false;
            this.lastTimestamp = performance.now();
        }, MarqueeCarousel.RESUME_DELAY_MS);
    }
}
