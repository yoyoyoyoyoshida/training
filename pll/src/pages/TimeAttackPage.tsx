import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AVAILABLE_COLORS,
  DEFAULT_COLOR_MODE_MAP,
  PLL_IMAGE_MAP,
  PLL_OPTIONS,
  getPracticeImagePath,
  type CubeColor,
  type PllId,
} from '../data/pllData';
import { pickOne } from '../utils/random';
import { audioPlayer } from '../utils/audioPlayer';
import { progressManager } from '../utils/progressManager';
import { highScoreManager } from '../utils/highScoreManager';
import { colorPreferences, type ColorMode } from '../utils/colorPreferences';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { useSessionStore } from '../store/sessionStore';
import AdSenseSlot from '../components/AdSenseSlot';
import BackHomeButton from '../components/BackHomeButton';
import type { GameQuestion, WrongAnswer } from '../types';
import { profileManager } from '../utils/profileManager';
import { firestore, isFirebaseConfigured } from '../utils/firebaseClient';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import challengeCoachIcon from '../../icon/3.png';
import './TimeAttackPage.css';

const GAME_DURATION = 60;
const COUNTDOWN_SECONDS = 3;

const createQuestions = (colors: CubeColor[], total = 1000): GameQuestion[] => {
  const effectiveColors = colors.length === 0 ? DEFAULT_COLOR_MODE_MAP[1] : colors;
  const pool: GameQuestion[] = [];
  for (let i = 0; i < total; i += 1) {
    const pll = pickOne(PLL_OPTIONS);
    const image = pickOne(PLL_IMAGE_MAP[pll]);
    const color = pickOne(effectiveColors);
    pool.push({ pll, imageFileName: image, color });
  }
  return pool;
};

function TimeAttackPage() {
  const [colorMode, setColorMode] = useState<ColorMode>(colorPreferences.getMode());
  const [selectedColors, setSelectedColors] = useState<CubeColor[]>(colorPreferences.getSelectedColors());
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'running' | 'finished'>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [remaining, setRemaining] = useState(GAME_DURATION);
  const [streak, setStreak] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<GameQuestion[]>(() => createQuestions(colorPreferences.getSelectedColors()));
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion>(questions[0]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [lastSelected, setLastSelected] = useState<CubeColor | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [highScores, setHighScores] = useState({
    daily: highScoreManager.getDailyHighScore(),
    allTime: highScoreManager.getAllTimeHighScore(),
  });
  const [timeNotice, setTimeNotice] = useState<{ message: string; type: 'bonus' | 'penalty' } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const [playerName, setPlayerName] = useState(() => profileManager.getName());
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const setTimeAttackResult = useSessionStore((state) => state.setTimeAttackResult);

  const triggerTimeNotice = useCallback((message: string, type: 'bonus' | 'penalty') => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    setTimeNotice({ message, type });
    noticeTimerRef.current = window.setTimeout(() => {
      setTimeNotice(null);
      noticeTimerRef.current = null;
    }, 1200);
  }, []);

  useEffect(() => {
    if (questions.length === 0) return;
    setCurrentQuestion(questions[questionIndex % questions.length]);
  }, [questionIndex, questions]);

  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown <= 0) {
      setGameState('running');
      setRemaining(GAME_DURATION);
      return;
    }
    const id = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(id);
  }, [gameState, countdown]);

  useEffect(() => {
    if (gameState !== 'running') return;
    if (remaining <= 0) {
      finishGame();
      return;
    }
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, remaining]);

  const startGame = () => {
    if (colorMode !== 6 && selectedColors.length < colorMode) {
      alert(`${colorMode}色モードでは${colorMode}色選択してください`);
      return;
    }
    colorPreferences.setMode(colorMode);
    colorPreferences.setSelectedColors(selectedColors);
    const pool = createQuestions(selectedColors);
    setQuestions(pool);
    setQuestionIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongAnswers([]);
    setCountdown(COUNTDOWN_SECONDS);
    setRemaining(GAME_DURATION);
    setGameState('countdown');
    setIsLocked(false);
    setStreak(0);
    setTimeNotice(null);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  };

  const finishGame = () => {
    if (gameState === 'finished') return;
    setGameState('finished');
    const totalAnswered = correctCount + wrongCount;
    highScoreManager.saveScore(correctCount);
    setHighScores({
      daily: highScoreManager.getDailyHighScore(),
      allTime: highScoreManager.getAllTimeHighScore(),
    });
    const playCount = storage.getNumber(STORAGE_KEYS.timeAttackCount, 0) + 1;
    storage.setNumber(STORAGE_KEYS.timeAttackCount, playCount);
    const reviewPayload = {
      wrongAnswers,
      colors: selectedColors,
      difficulty: colorMode,
      completedAt: new Date().toISOString(),
    };
    storage.setJSON(STORAGE_KEYS.timeAttackReview, reviewPayload);
    setTimeAttackResult(
      {
        totalAnswered,
        correctCount,
        wrongCount,
        wrongAnswers,
        durationSeconds: GAME_DURATION,
        colors: selectedColors,
        completedAt: new Date().toISOString(),
      },
      questions,
    );
  };

  const handleColorModeChange = (mode: ColorMode) => {
    setColorMode(mode);
    const defaults = DEFAULT_COLOR_MODE_MAP[mode];
    setSelectedColors(defaults);
    setLastSelected(null);
  };

  const handleColorToggle = (color: CubeColor) => {
    if (colorMode === 6) return;

    if (colorMode === 1) {
      setSelectedColors([color]);
      setLastSelected(color);
      return;
    }

    setSelectedColors((prev) => {
      if (prev.includes(color)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== color);
      }

      if (prev.length < 2) {
        setLastSelected(color);
        return [...prev, color];
      }

      if (lastSelected && prev.includes(lastSelected)) {
        const other = prev.find((c) => c !== lastSelected) ?? prev[0];
        setLastSelected(color);
        return [other, color];
      }

      setLastSelected(color);
      return [prev[1], color];
    });
  };

  const handleAnswer = async (answer: PllId) => {
    if (gameState !== 'running' || isLocked) return;
    const question = questions[questionIndex % questions.length];
    const isCorrect = answer === question.pll;
    setIsLocked(true);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setRemaining((prevRemaining) => prevRemaining + 5);
          triggerTimeNotice('+5秒ボーナス！', 'bonus');
          return 0;
        }
        return next;
      });
      await progressManager.markPllAsCorrect(question.pll);
      audioPlayer.play('correct');
    } else {
      setWrongCount((prev) => prev + 1);
      setStreak(0);
      setRemaining((prevRemaining) => Math.max(prevRemaining - 2, 0));
      triggerTimeNotice('-2秒ペナルティ…', 'penalty');
      setWrongAnswers((prev) => [
        ...prev,
        {
          correctPll: question.pll,
          userAnswer: answer,
          imagePath: getPracticeImagePath(question.pll, question.imageFileName, question.color),
          questionNumber: questionIndex + 1,
        },
      ]);
      await progressManager.markPllAsWrong(question.pll);
      audioPlayer.play('wrong');
    }

    window.setTimeout(() => {
      setQuestionIndex((prev) => prev + 1);
      setIsLocked(false);
    }, 220);
  };

  const resetGame = () => {
    setGameState('idle');
    setCountdown(COUNTDOWN_SECONDS);
    setRemaining(GAME_DURATION);
    setQuestionIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongAnswers([]);
    setIsLocked(false);
    setTimeNotice(null);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    setRegisterError(null);
    setRegisterSuccess(false);
  };

  const optionList = useMemo(() => [...PLL_OPTIONS], []);
  const isSetup = gameState === 'idle';
  const activeQuestion = currentQuestion;

  useEffect(() => () => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  }, []);

  return (
    <section className={`time-attack ${isSetup ? 'time-attack--setup' : 'time-attack--play'}`}>
      <div className="time-attack__coach-wrapper">
        <div className="time-attack__coach">
          <img src={challengeCoachIcon} alt="コーチ" />
          <div className="time-attack__coach-bubble">
            <p>実力を試そう！</p>
          </div>
        </div>
      </div>
      {isSetup ? (
        <>
          <div className="time-attack__rules">
            <button
              type="button"
              className="time-attack__rules-toggle"
              onClick={() => setShowRules((prev) => !prev)}
            >
              {showRules ? 'ルールを閉じる' : 'ルールを表示'}
            </button>
            {showRules ? (
              <div className="time-attack__rules-body">
                <p>制限時間は60秒です。間違えると -2 秒、3問連続正解で +5 秒のボーナスが入ります。</p>
              </div>
            ) : null}
          </div>

          <div className="time-attack__setup">
            <div className="time-attack__mode">
              <h2>難易度選択</h2>
              <div className="time-attack__mode-buttons">
                {[1, 2, 6].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={mode === colorMode ? 'is-active' : ''}
                    onClick={() => handleColorModeChange(mode as ColorMode)}
                  >
                    {mode === 1 ? '1色' : mode === 2 ? '2色' : '6色'}
                  </button>
                ))}
              </div>
            </div>

            <div className="time-attack__colors">
              <h2>クロス色を選択</h2>
              <div className="time-attack__color-pills">
                {AVAILABLE_COLORS.map((color) => {
                  const selected = colorMode === 6 || selectedColors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      className={`color-pill ${color.toLowerCase()} ${selected ? 'is-selected' : ''}`}
                      onClick={() => handleColorToggle(color)}
                      disabled={colorMode === 6}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
              <p className="time-attack__color-hint">
                {colorMode === 6
                  ? '全ての色が出題対象です。'
                  : `${selectedColors.length}/${colorMode} 色選択中`}
              </p>
            </div>

            <button type="button" className="time-attack__start" onClick={startGame}>
              スタート
            </button>
          </div>

          <AdSenseSlot format="horizontal" />
          <BackHomeButton />
        </>
      ) : (
        <div className="time-attack__play">
          <div className="time-attack__board">
            <div className="time-attack__timer">
              <span className="time">{remaining.toString().padStart(2, '0')}s</span>
              <span className="counter">正解 {correctCount} / ミス {wrongCount}</span>
            </div>
            {timeNotice ? (
              <div className={`time-notice ${timeNotice.type === 'bonus' ? 'is-bonus' : 'is-penalty'}`}>
                {timeNotice.message}
              </div>
            ) : null}

            {gameState === 'countdown' ? (
              <div className="time-attack__countdown">{countdown}</div>
            ) : null}

            {gameState === 'running' && activeQuestion ? (
              <div className="time-attack__question">
                <div className="time-attack__image">
                  <img
                    src={getPracticeImagePath(
                      activeQuestion.pll,
                      activeQuestion.imageFileName,
                      activeQuestion.color,
                    )}
                    alt={`${activeQuestion.pll} pattern`}
                    key={`${activeQuestion.pll}-${questionIndex}`}
                  />
                </div>
                <div className="time-attack__options">
                  {optionList.map((pll) => (
                    <button
                      key={`${questionIndex}-${pll}`}
                      type="button"
                      onClick={() => handleAnswer(pll)}
                      disabled={isLocked}
                    >
                      {pll}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {gameState === 'finished' ? (
              <div className="time-attack__result">
                <h2>結果</h2>
                <p>
                  正解 {correctCount} / 合計 {correctCount + wrongCount} 問
                </p>
                <p>
                  誤答 {wrongAnswers.length} 問（復習モードで確認できます）
                </p>
                <div className="time-attack__ranking">
                  <label htmlFor="player-name">ランキング登録名</label>
                  <input
                    id="player-name"
                    value={playerName}
                    maxLength={20}
                    onChange={(event) => {
                      setPlayerName(event.currentTarget.value);
                      setRegisterError(null);
                      setRegisterSuccess(false);
                    }}
                    placeholder="プレイヤー名を入力"
                  />
                  {registerError ? <p className="time-attack__error">{registerError}</p> : null}
                  {registerSuccess ? <p className="time-attack__success">登録しました！</p> : null}
                  <button
                    type="button"
                    className="time-attack__register"
                    onClick={async () => {
                      if (!isFirebaseConfigured || !firestore) {
                        setRegisterError('Firebase未設定のため登録できません');
                        return;
                      }
                      const trimmed = playerName.trim();
                      if (!trimmed) {
                        setRegisterError('名前を入力してください');
                        setRegisterSuccess(false);
                        return;
                      }
                      setRegisterError(null);
                      setRegisterSuccess(false);
                      setIsRegistering(true);
                      try {
                        await addDoc(collection(firestore, 'global_rankings'), {
                          name: trimmed,
                          score: correctCount,
                          timestamp: serverTimestamp(),
                          difficulty: colorMode,
                          colors: selectedColors,
                        });
                        setRegisterSuccess(true);
                        profileManager.saveName(trimmed);
                      } catch (error) {
                        setRegisterError('登録に失敗しました');
                      } finally {
                        setIsRegistering(false);
                      }
                    }}
                    disabled={isRegistering}
                  >
                    {isRegistering ? '登録中...' : 'ランキングに登録する'}
                  </button>
                </div>
                <div className="time-attack__result-actions">
                  <button type="button" onClick={startGame}>もう一度挑戦</button>
                  <button type="button" onClick={resetGame} className="is-secondary">
                    設定に戻る
                  </button>
                  <Link className="time-attack__result-link" to="/ranking">
                    ランキング確認
                  </Link>
                  <Link className="time-attack__result-link" to="/review">
                    復習する
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <div className="time-attack__sidebar">
            <h3>自己ベスト</h3>
            <ul>
              <li>本日の最高: {highScores.daily} 問</li>
              <li>歴代最高: {highScores.allTime} 問</li>
              <li>復習リスト: {wrongAnswers.length} 件</li>
            </ul>
          </div>

          <AdSenseSlot format="horizontal" />
          <BackHomeButton />
        </div>
      )}
    </section>
  );
}

export default TimeAttackPage;
