import { Link } from 'react-router-dom';
import { useCallback } from 'react';
import ActionCard from '../components/ActionCard';
import AdSenseSlot from '../components/AdSenseSlot';
import BackHomeButton from '../components/BackHomeButton';
import practiceGuideIcon from '../../icon/2.png';
import './PracticeHubPage.css';

function PracticeHubPage() {
  const handlePracticeClick = useCallback(() => {
    // 実践練習は準備中。ダイアログで案内する。
    window.alert('実践練習は現在開発中です。公開をお楽しみに！');
  }, []);

  return (
    <section className="practice">
      <header className="practice__header">
        <div className="practice__coach">
          <img src={practiceGuideIcon} alt="コーチ" />
          <div className="practice__coach-bubble">
            <p>練習しよう！</p>
          </div>
        </div>
      </header>

      <div className="practice__list">
        <ActionCard
          title="1. 名前を覚える"
          description="PLLごとの立体図・2D図を並べたカードを使って、形と名称のリンクを強化します。"
          to="/practice/name-learn"
          accent="green"
          icon={<span role="img" aria-label="name learn">📚</span>}
        />
        <ActionCard
          title="2. 確認テスト"
          description="全21パターンから出題されるクイズで理解度をチェック。誤答は自動で復習リストに追加されます。"
          to="/practice/quiz"
          accent="blue"
          icon={<span role="img" aria-label="quiz">📝</span>}
        />
        <ActionCard
          title="3. 実践練習"
          description="実戦モードは現在開発中です。近日公開予定！"
          to="#"
          accent="pink"
          icon={<span role="img" aria-label="practice coming soon">🚧</span>}
          onClick={handlePracticeClick}
        />
      </div>

      <div className="practice__review">
        <Link to="/review" className="practice__review-link">前回の誤答を復習する →</Link>
      </div>

      <AdSenseSlot />
      <BackHomeButton />
    </section>
  );
}

export default PracticeHubPage;
