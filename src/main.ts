import { InMemoryCommunityAppRepository } from './infrastructure/repositories/InMemoryCommunityAppRepository';
import { AppPlayerModal } from './presentation/components/modal/AppPlayerModal';
import { CatalogModal } from './presentation/components/modal/CatalogModal';
import { MarqueeCarousel } from './presentation/components/carousel/MarqueeCarousel';

/**
 * アプリケーションの初期化と依存関係の注入（DI）
 */
function bootstrap(): void {
    // 1. リポジトリ（データ層）の初期化
    const repository = new InMemoryCommunityAppRepository();

    // 2. モーダルコンポーネント（UI層）の初期化
    const playerModal = new AppPlayerModal(repository);
    const catalogModal = new CatalogModal(repository);

    // カタログから遊ぶボタン押下時の連携
    catalogModal.setOnPlayApp((appId) => {
        void playerModal.open(appId);
    });

    // 3. コミュニティカルーセル（UI層）の初期化
    new MarqueeCarousel({
        onPlayApp: (appId) => {
            void playerModal.open(appId);
        },
        onSubmitApp: () => {
            window.open('https://gachi-cube.com/contact.php', '_blank', 'noopener,noreferrer');
        },
    });

    // 4. カタログモーダル開くトリガーボタンのバインド
    const openCatalogBtn = document.getElementById('openCatalogBtn');
    if (openCatalogBtn) {
        openCatalogBtn.addEventListener('click', () => {
            void catalogModal.open();
        });
    }

    // 5. HTMLインライン属性や外部からの呼び出し互換性レイヤー
    const globalContext = window as unknown as Record<string, unknown>;
    globalContext.openCatalogModal = () => void catalogModal.open();
    globalContext.closeCatalogModal = () => catalogModal.close();
    globalContext.openAppModal = (appId: string) => void playerModal.open(appId);
    globalContext.closeAppModal = () => playerModal.close();
    globalContext.reloadModalIframe = () => playerModal.reload();
    globalContext.handleCardPlayClick = (appId: string) => void playerModal.open(appId);
    globalContext.handleCardSubmitClick = () => {
        window.open('https://gachi-cube.com/contact.php', '_blank', 'noopener,noreferrer');
    };
}

// DOMContentLoaded の完了後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
