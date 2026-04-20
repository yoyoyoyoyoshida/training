import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLL_OPTIONS, getLearnImagePath, type PllId } from '../data/pllData';
import { shuffle } from '../utils/random';
import { progressManager } from '../utils/progressManager';
import { audioPlayer } from '../utils/audioPlayer';
import { useSessionStore } from '../store/sessionStore';
import AdSenseSlot from '../components/AdSenseSlot';
import BackHomeButton from '../components/BackHomeButton';
import type { WrongAnswer } from '../types';
import './QuizPage.css';

const TOTAL_QUESTIONS = PLL_OPTIONS.length;

function QuizPage() {
  const questionOrder = useMemo(() => shuffle([...PLL_OPTIONS]), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<PllId | null>(null);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isLocked, setIsLocked] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const setQuizResult = useSessionStore((state) => state.setQuizResult);

  const currentPll = questionOrder[currentIndex];

  const handleSelect = async (pll: PllId) => {
    if (isLocked || isFinished) return;

    setSelected(pll);
    const isCorrect = pll === currentPll;
    setStatus(isCorrect ? 'correct' : 'wrong');
    setIsLocked(true);

    let updatedScore = score;
    let updatedWrongAnswers = wrongAnswers;

    if (isCorrect) {
      updatedScore = score + 1;
      setScore(updatedScore);
      await progressManager.markPllAsCorrect(currentPll);
      audioPlayer.play('correct');
    } else {
      const entry: WrongAnswer = {
        correctPll: currentPll,
        userAnswer: pll,
        imagePath: getLearnImagePath(currentPll, `${currentPll}.png`),
        questionNumber: currentIndex + 1,
      };
      updatedWrongAnswers = [...wrongAnswers, entry];
      setWrongAnswers(updatedWrongAnswers);
      await progressManager.markPllAsWrong(currentPll);
      audioPlayer.play('wrong');
    }

    const finalize = () => {
      if (currentIndex === TOTAL_QUESTIONS - 1) {
        setIsFinished(true);
        setQuizResult({
          score: updatedScore,
          totalQuestions: TOTAL_QUESTIONS,
          wrongAnswers: updatedWrongAnswers,
          completedAt: new Date().toISOString(),
        });
      } else {
        setCurrentIndex((prev) => prev + 1);
        setSelected(null);
        setStatus('idle');
        setIsLocked(false);
      }
    };

    window.setTimeout(finalize, 850);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setWrongAnswers([]);
    setStatus('idle');
    setIsLocked(false);
    setIsFinished(false);
    useSessionStore.getState().clearReview();
  };

  const correctRate = Math.round((score / TOTAL_QUESTIONS) * 100);

  return (
    <section className="quiz">
      <header className="quiz__header">
        <div>
          <h1>確認テスト</h1>
          <p>21問連続でPLLを判別できるかチェックしましょう。</p>
        </div>
        <div className="quiz__progress">
          <span>
            問題 {currentIndex + 1} / {TOTAL_QUESTIONS}
          </span>
          <span>正解 {score}</span>
        </div>
      </header>

      <div className="quiz__question">
        <div className={`quiz__image quiz__image--${status}`}>
          <img
            src={getLearnImagePath(currentPll, `${currentPll}.png`)}
            alt={`${currentPll} pattern`}
            key={currentPll}
          />
        </div>
        <p className="quiz__instruction">正解だと思うPLLの名前を選択してください。</p>
      </div>

      <div className="quiz__options">
        {PLL_OPTIONS.map((pll) => {
          const isActive = selected === pll;
          const isCorrect = status !== 'idle' && pll === currentPll;
          const isWrongChoice = status === 'wrong' && isActive;
          return (
            <button
              key={pll}
              type="button"
              className={[
                'quiz__option',
                isActive ? 'quiz__option--selected' : '',
                isCorrect ? 'quiz__option--correct' : '',
                isWrongChoice ? 'quiz__option--wrong' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSelect(pll)}
              disabled={isLocked}
            >
              {pll}
            </button>
          );
        })}
      </div>

      {isFinished ? (
        <div className="quiz__result">
          <h2>お疲れさまでした！</h2>
          <p>
            正解 {score} / {TOTAL_QUESTIONS} ({Number.isNaN(correctRate) ? 0 : correctRate}%)
          </p>
          {wrongAnswers.length > 0 ? (
            <p>
              <strong>{wrongAnswers.length}</strong> 問を復習リストに追加しました。
              <br />
              <Link to="/review">復習モードで確認する →</Link>
            </p>
          ) : (
            <p>全問正解です！素晴らしい！</p>
          )}
          <div className="quiz__result-actions">
            <button type="button" onClick={handleRetry} className="quiz__retry">
              もう一度挑戦する
            </button>
          </div>
        </div>
      ) : null}

      <AdSenseSlot />
      <div className="quiz__footer">
        <Link to="/practice" className="quiz__footer-button">
          練習メニューへ戻る
        </Link>
        <BackHomeButton />
      </div>
    </section>
  );
}

export default QuizPage;
