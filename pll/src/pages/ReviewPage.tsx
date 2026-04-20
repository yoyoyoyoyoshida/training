import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { storage, STORAGE_KEYS } from '../utils/storage';
import type { WrongAnswer } from '../types';
import type { CubeColor } from '../data/pllData';
import './ReviewPage.css';

interface StoredTimeAttackReview {
  wrongAnswers: WrongAnswer[];
  completedAt: string;
  colors?: CubeColor[];
  difficulty?: number;
}

function ReviewPage() {
  const { lastQuizResult, lastTimeAttackResult, clearReview } = useSessionStore();
  const [storedTimeAttack, setStoredTimeAttack] = useState<StoredTimeAttackReview | null>(
    () => storage.getJSON<StoredTimeAttackReview | null>(STORAGE_KEYS.timeAttackReview, null),
  );

  useEffect(() => {
    const saved = storage.getJSON<StoredTimeAttackReview | null>(STORAGE_KEYS.timeAttackReview, null);
    setStoredTimeAttack(saved);
  }, [lastTimeAttackResult]);

  const handleClear = () => {
    clearReview();
    storage.remove(STORAGE_KEYS.timeAttackReview);
    setStoredTimeAttack(null);
  };

  const hasQuizMistakes = (lastQuizResult?.wrongAnswers.length ?? 0) > 0;
  const timeAttackWrongAnswers =
    lastTimeAttackResult?.wrongAnswers.length
      ? lastTimeAttackResult.wrongAnswers
      : storedTimeAttack?.wrongAnswers ?? [];
  const hasTimeAttackMistakes = timeAttackWrongAnswers.length > 0;
  const hasContent = hasQuizMistakes || hasTimeAttackMistakes;

  const reviewItems = useMemo(() => {
    const quizItems = lastQuizResult?.wrongAnswers.map((item) => ({
      ...item,
      mode: '確認テスト',
    })) ?? [];
    const taItems = timeAttackWrongAnswers.map((item) => ({
      ...item,
      mode: 'タイムアタック',
    }));
    return [...quizItems, ...taItems];
  }, [lastQuizResult, timeAttackWrongAnswers]);

  return (
    <section className="review">
      <header className="review__header">
        <h1>復習モード</h1>
        <p>直近のプレイで間違えた問題を振り返りましょう。ブラウザを閉じても履歴は保持されます。</p>
        <button
          type="button"
          className="review__clear"
          onClick={handleClear}
          disabled={!hasContent}
        >
          復習リストをクリア
        </button>
      </header>

      {!hasContent ? (
        <div className="review__empty">
          <p>復習する問題はありません。<Link to="/practice/quiz">確認テスト</Link>や<Link to="/practice/time-attack">タイムアタック</Link>に挑戦してみましょう。</p>
        </div>
      ) : (
        <div className="review__list">
          {reviewItems.map((item, index) => (
            <article key={`${item.mode}-${index}`} className="review__card">
              <div className="review__thumb">
                <img src={item.imagePath} alt={`${item.correctPll} illustration`} loading="lazy" />
              </div>
              <div className="review__body">
                <span className="review__mode">{item.mode}</span>
                <h2>Q{item.questionNumber.toString().padStart(2, '0')}</h2>
                <p>
                  <strong>正解:</strong> {item.correctPll}
                  <br />
                  <strong>あなたの解答:</strong> {item.userAnswer}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="review__actions">
        <Link to="/practice/time-attack" className="review__action-button">
          もう一度挑戦する
        </Link>
        <Link to="/" className="review__action-button secondary">
          PLLホームに戻る
        </Link>
      </div>
    </section>
  );
}

export default ReviewPage;
