import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import { RubiksCube } from './components/RubiksCube';
import { createInitialState, performMoves, performMove, Move } from './utils/cubeState';
import { checkCrossSolved } from './utils/crossValidator';
import { VirtualPad } from './components/VirtualPad';
import { RankingBoard } from './components/RankingBoard';
import { ResultModal } from './components/ResultModal';
import { ProfileModal } from './components/ProfileModal';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { getDailyScramble } from './utils/scrambleGenerator';
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { GlobalRankingModal } from './components/GlobalRankingModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';

type GameStatus = 'IDLE' | 'PLAYING' | 'SOLVED';

function App() {
  const { user, login, logout } = useAuth();
  const { profileName, updateProfileData, isNewUser } = useProfile(user);
  const [isLogoHover, setIsLogoHover] = useState(false);
  const [trainingStats, setTrainingStats] = useState<{ totalSessions: number, rank: number, totalUsers: number } | null>(null);
  const [hasStartedDaily, setHasStartedDaily] = useState(false);
  const [isDailyConfirmOpen, setIsDailyConfirmOpen] = useState(false);
  const [isDailyLoading, setIsDailyLoading] = useState(false);
  
  const [cubies, setCubies] = useState(() => performMove(createInitialState(), 'x2'));
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [currentBatchId, setCurrentBatchId] = useState<string>('');
  const [moveCount, setMoveCount] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [moveLog, setMoveLog] = useState<Move[]>([]); 
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGlobalRankingOpen, setIsGlobalRankingOpen] = useState(false);
  const [replayData, setReplayData] = useState<{ moves: Move[], userName: string } | null>(null);
  const [currentScramble, setCurrentScramble] = useState<string[]>([]);
  const [hasCompletedDaily, setHasCompletedDaily] = useState(false); 
  const timerRef = useRef<number | null>(null);
  const replayRef = useRef<boolean>(false);

  useEffect(() => {
    if (isNewUser) {
      setIsProfileModalOpen(true);
    }
  }, [isNewUser]);

  useEffect(() => {
    const checkDailyStatus = async () => {
      if (!user) return;
      
      const daily = getDailyScramble();
      const q = query(
        collection(db, 'dailyChallenges'),
        where('userId', '==', user.uid),
        where('date', '==', daily.batchId)
      );
      
      const snap = await getDocs(q);
      if (!snap.empty) {
        setHasStartedDaily(true);
      }

      const qScore = query(
        collection(db, 'scores'),
        where('userId', '==', user.uid),
        where('batchId', '==', daily.batchId)
      );
      const snapScore = await getDocs(qScore);
      if (!snapScore.empty) {
        setHasCompletedDaily(true);
      }
    };

    checkDailyStatus();
  }, [user]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('PLAYING');
    const startObj = Date.now() - timeMs;
    timerRef.current = window.setInterval(() => {
      setTimeMs(Date.now() - startObj);
    }, 10);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startNewGame = () => {
    stopTimer();
    setMoveCount(0);
    setTimeMs(0);
    setMoveLog([]);
    setReplayData(null);
    setStatus('IDLE');
  };

  useEffect(() => {
    if (status === 'PLAYING') {
      const isSolved = checkCrossSolved(cubies, 'WHITE') || checkCrossSolved(cubies, 'YELLOW');
      if (isSolved) {
        setStatus('SOLVED');
        stopTimer();
        
        if (currentBatchId.startsWith('FREE_PRACTICE_')) {
          if (user) {
            handleAutoSaveTraining();
          } else {
            setTrainingStats(null);
          }
        }
        
        setTimeout(() => setIsResultModalOpen(true), 500);
      }
    }
  }, [cubies, status, user, currentBatchId]);

  const handleAutoSaveTraining = async () => {
    try {
      await addDoc(collection(db, 'scores'), {
        userId: user!.uid,
        userName: profileName || 'GUEST',
        moveCount: moveCount,
        timeTaken: timeMs,
        moveLog: moveLog,
        scramble: currentScramble,
        batchId: currentBatchId,
        createdAt: serverTimestamp(),
      });

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'scores'),
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
        orderBy('createdAt', 'desc')
      );
      
      const snap = await getDocs(q);
      const userCounts: Record<string, number> = {};
      
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.batchId && String(data.batchId).startsWith('FREE_PRACTICE_')) {
          userCounts[data.userId] = (userCounts[data.userId] || 0) + 1;
        }
      });

      const sortedUsers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]);
      const myRank = sortedUsers.findIndex(([uid]) => uid === user!.uid) + 1;
      
      setTrainingStats({
        totalSessions: userCounts[user!.uid] || 1,
        rank: myRank || 1,
        totalUsers: sortedUsers.length
      });

    } catch (err) {
      console.error("Auto save failed:", err);
    }
  };

  const handleResultSubmit = async (displayName: string) => {
    // 全国大会（DAILY_）の場合のみ、ランキング用スコアとして送信する
    if (!currentBatchId.startsWith('DAILY_')) {
      setIsResultModalOpen(false);
      return;
    }

    try {
      const scoreData: any = {
        userId: user?.uid || 'guest_' + Date.now(),
        userName: displayName || 'ゲスト',
        moveCount: moveCount,
        timeTaken: timeMs,
        moveLog: moveLog,
        scramble: currentScramble,
        batchId: currentBatchId,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'scores'), scoreData);

      if (user) {
        await updateProfileData(user.uid, displayName);
        setHasCompletedDaily(true);
      }
      
      setIsResultModalOpen(false);
    } catch (err) {
      console.error("Score save failed:", err);
      alert("保存に失敗しました。");
    }
  };

  const handleProfileSave = async (newName: string) => {
    if (user) {
      await updateProfileData(user.uid, newName);
      setIsProfileModalOpen(false);
    }
  };

  const handleWatchReplay = async (moves: string[], solveName: string, scramble: string[]) => {
    if (!user) {
      alert("リプレイを視聴するにはGoogleログインが必要です。");
      return;
    }
    const daily = getDailyScramble();
    // 「すでに挑戦権を消費している」かつ「現在1発勝負のプレイ画面ではない（＝諦めてリロードした等）」場合は視聴許可
    const isFailedOrGivenUp = hasStartedDaily && currentBatchId !== daily.batchId;

    if (!hasCompletedDaily && !isFailedOrGivenUp) {
      alert("まずはご自身で「本日の1発勝負」に挑戦してください！（プレイ中のネタバレは防止されています）");
      return;
    }

    stopTimer();
    replayRef.current = true;
    const initialState = performMove(createInitialState(), 'x2');
    setCubies(performMoves(initialState, scramble));
    setStatus('IDLE');
    setMoveCount(0);
    setTimeMs(0);
    setReplayData({ moves, userName: solveName });

    let currentCube = performMoves(initialState, scramble);
    for (let i = 0; i < moves.length; i++) {
      if (!replayRef.current) break; 
      
      await new Promise(r => setTimeout(r, 800));
      
      if (!replayRef.current) break;

      const m = moves[i];
      currentCube = performMove(currentCube, m);
      setCubies([...currentCube]);
      setMoveCount(i + 1);
    }
    
    setTimeout(() => {
      setReplayData(null);
      replayRef.current = false;
    }, 2000);
  };

  const handleInputMove = (move: Move) => {
    if (replayData) return;

    const mCore = move.replace(/['2\sw]/gi, '').toLowerCase();
    const isPhysical = !['x', 'y', 'z'].includes(mCore) && mCore.length > 0;

    // ゲーム開始の判定（モードが選択され、かつIDがある時のみタイマー開始）
    if (status === 'IDLE' && isPhysical && currentBatchId && currentBatchId !== '') {
      startTimer();
      // 最初の1手も即座にカウント
      setMoveCount(1);
      setMoveLog([move]);
    }

    setCubies(prev => performMove(prev, move));

    // すでにプレイ中（PLAYING）の場合のみ追加で記録を更新
    if (status === 'PLAYING' && currentBatchId && currentBatchId !== '') {
      if (isPhysical) {
        setMoveCount(prev => prev + 1);
      }
      setMoveLog(prev => [...prev, move]);
    }
  };

  const resetGameStates = () => {
    stopTimer();
    setMoveCount(0);
    setTimeMs(0);
    setMoveLog([]);
    setReplayData(null);
  };

  const handleRandomScramble = () => {
    resetGameStates();
    const initialState = performMove(createInitialState(), 'x2');
    const scramble = Array.from({ length: 20 }, () => {
      const moves = ['R', "R'", 'R2', 'L', "L'", 'L2', 'U', "U'", 'U2', 'D', "D'", 'D2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
      return moves[Math.floor(Math.random() * moves.length)];
    });
    setCubies(performMoves(initialState, scramble));
    setCurrentScramble(scramble);
    setStatus('IDLE');
    setCurrentBatchId('FREE_PRACTICE_' + Date.now()); 
  };

  const handleDailyScrambleClick = () => {
    if (!user) {
      if (window.confirm("「全国大会」に参加するにはGoogleログインが必要です。ログイン画面を表示しますか？")) {
        login();
      }
      return;
    }
    if (hasCompletedDaily || hasStartedDaily) return;
    setIsDailyConfirmOpen(true);
  };

  const confirmDailyChallenge = async () => {
    if (!user) return;
    setIsDailyLoading(true);
    
    try {
      const daily = getDailyScramble();
      
      await addDoc(collection(db, 'dailyChallenges'), {
        userId: user.uid,
        date: daily.batchId,
        createdAt: serverTimestamp()
      });

      setHasStartedDaily(true);
      setIsDailyConfirmOpen(false);

      const dailyScramble = getDailyScramble();
      setCurrentScramble(dailyScramble.scramble);
      setCubies(performMoves(performMove(createInitialState(), 'x2'), dailyScramble.scramble));
      setCurrentBatchId(dailyScramble.batchId);
      startNewGame();
    } catch (err) {
      console.error("Challenge start failed:", err);
      alert("通信に失敗しました。もう一度お試しください。");
    } finally {
      setIsDailyLoading(false);
    }
  };


  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }} onMouseEnter={() => setIsLogoHover(true)} onMouseLeave={() => setIsLogoHover(false)}>
          <img 
            src="./logo.svg" 
            alt="Logo" 
            style={{ width: '32px', height: '32px', filter: isLogoHover ? 'drop-shadow(0 0 10px var(--accent-green))' : 'none', transition: 'all 0.3s' }} 
          />
          <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CROSS PRACTICE
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a href="/training/" className="back-link" style={{ fontSize: '1.2rem', marginRight: '0.8rem', opacity: 0.7, color: '#fff', textDecoration: 'none', fontWeight: 900 }}>
            ←
          </a>

          <button 
            onClick={() => setIsGlobalRankingOpen(true)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px', height: '32px', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: '#fff', 
              cursor: 'pointer', marginRight: '0.5rem', padding: '0 8px', gap: '6px'
            }}
            title="ランキング"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34"></path>
              <path d="M12 22v-4"></path>
              <path d="M17 4H7a2 2 0 0 0-2 2v3a7 7 0 0 0 14 0V6a2 2 0 0 0-2-2Z"></path>
            </svg>
            <span className="hide-on-mobile" style={{ fontSize: '0.75rem', fontWeight: 800 }}>ランキング</span>
          </button>
          
          {user ? (
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '50px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-green)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem' }}>
                {profileName.charAt(0)}
              </div>
              <div className="hide-on-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{profileName}</span>
              </div>
            </div>
          ) : (
            <button className="primary-btn" onClick={login} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>
              ログイン
            </button>
          )}
        </div>
      </header>

      <main className="cube-container">
        {/* 統計オーバーレイ (TIME) */}
        <div style={{ 
          position: 'absolute', top: '1rem', left: '1rem', 
          zIndex: 50, pointerEvents: 'none' 
        }}>
          <div className="stat-card" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 800 }}>TIME</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-green)', lineHeight: 1 }}>{(timeMs / 1000).toFixed(2)}s</div>
          </div>
        </div>

        {/* 統計オーバーレイ (MOVES) */}
        <div style={{ 
          position: 'absolute', top: '1rem', right: '1rem', 
          zIndex: 50, pointerEvents: 'none' 
        }}>
          <div className="stat-card" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 800 }}>MOVES</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff', lineHeight: 1 }}>{moveCount}</div>
          </div>
        </div>

        <Canvas camera={{ position: [6.5, 6.5, 6.5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="var(--accent-blue)" />
          <RubiksCube cubies={cubies} />
          <OrbitControls enablePan={false} enableZoom={false} />
        </Canvas>
        
      </main>

      <section className="controls-section">
        {/* モード選択エリア */}
        <div style={{ 
          display: 'flex', gap: '0.4rem', flexWrap: 'wrap', 
          minHeight: '32px', alignItems: 'center', justifyContent: 'center',
          marginBottom: '0.2rem' 
        }}>
          {status === 'PLAYING' ? (
            <div style={{ 
              width: '100%', padding: '0.6rem', 
              background: currentBatchId.startsWith('DAILY_') ? 'rgba(255,20,147,0.1)' : 'rgba(0,122,255,0.1)', 
              border: `2px solid ${currentBatchId.startsWith('DAILY_') ? '#ff1493' : 'var(--accent-blue)'}`, 
              borderRadius: '10px', 
              color: currentBatchId.startsWith('DAILY_') ? '#ff1493' : 'var(--accent-blue)',
              textAlign: 'center', fontWeight: 900, fontSize: '1rem',
              animation: 'pulse 2s infinite'
            }}>
              {currentBatchId.startsWith('DAILY_') ? '🔥 真剣勝負中！' : '💪 トレーニング中！'}
            </div>
          ) : (
            <>
              <button 
                className="primary-btn" 
                onClick={() => {
                  if (hasCompletedDaily || hasStartedDaily) {
                    if (window.confirm("本日は挑戦済みです！また明日挑戦してください！\n本日のランキングを見ますか？")) {
                      setIsGlobalRankingOpen(true);
                    }
                  } else {
                    handleDailyScrambleClick();
                  }
                }}
                style={{ 
                  flex: '1.5 0 140px', 
                  background: 'var(--accent-green)', 
                  color: '#000',
                  padding: '0.6rem', fontSize: '0.8rem',
                  position: 'relative',
                  opacity: (hasCompletedDaily || hasStartedDaily) ? 0.7 : 1
                }}
              >
                本日の1発勝負 <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>(全国大会)</span>
                {(hasCompletedDaily || hasStartedDaily) && (
                  <span style={{ 
                    position: 'absolute', top: '-5px', right: '-5px', 
                    background: '#000', color: 'var(--accent-green)', 
                    fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px',
                    border: '1px solid var(--accent-green)', fontWeight: 900
                  }}>挑戦済</span>
                )}
              </button>
              <button 
                className="primary-btn" 
                onClick={handleRandomScramble}
                style={{ 
                  flex: '1 0 100px', 
                  background: 'var(--accent-blue)', 
                  color: '#fff',
                  padding: '0.6rem', fontSize: '0.8rem',
                  boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)'
                }}
              >
                トレーニング
              </button>
            </>
          )}
        </div>

        <VirtualPad onInputMove={handleInputMove} disabled={!!replayData} />

        <div className="hide-on-mobile" style={{ marginTop: '2rem' }}>
          <RankingBoard 
            batchId={getDailyScramble().batchId} 
            onWatchReplay={(moves, name, scramble) => {
              handleWatchReplay(moves, name, scramble);
            }} 
          />
        </div>

        <footer style={{ 
          textAlign: 'center', 
          padding: '0.4rem 0', 
          marginTop: 'auto',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          &copy; 2026 GACHI-CUBE Training | <a href="/training/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>Privacy</a>
        </footer>
      </section>

      {/* Modals & Overlays */}
      {replayData && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,122,255,0.9)', color: '#fff', padding: '0.8rem 1.5rem',
          borderRadius: '50px', fontWeight: 800, zIndex: 1000, display: 'flex', gap: '1rem',
          alignItems: 'center', boxShadow: '0 10px 30px rgba(0,122,255,0.4)',
          border: '2px solid #fff'
        }}>
          <span className="pulse">● REPLAYING</span>
          <span>{replayData.userName}'s Solve</span>
          <button 
            onClick={() => { setReplayData(null); replayRef.current = false; }}
            style={{ background: '#fff', color: 'var(--accent-blue)', border: 'none', borderRadius: '20px', padding: '2px 10px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}
          >
            STOP
          </button>
        </div>
      )}

      <ResultModal 
        isOpen={isResultModalOpen}
        timeMs={timeMs}
        moveCount={moveCount}
        user={user}
        initialName={profileName}
        onClose={() => setIsResultModalOpen(false)}
        onSubmit={handleResultSubmit}
        isTrainingMode={!currentBatchId.startsWith('DAILY_')}
        trainingStats={trainingStats}
        onLogin={login}
      />
      <ProfileModal 
        isOpen={isProfileModalOpen}
        currentName={profileName}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleProfileSave}
        onLogout={logout}
      />
      <DailyChallengeModal 
        isOpen={isDailyConfirmOpen}
        onClose={() => setIsDailyConfirmOpen(false)}
        onConfirm={confirmDailyChallenge}
        isLoading={isDailyLoading}
      />
      <GlobalRankingModal 
        isOpen={isGlobalRankingOpen}
        onClose={() => setIsGlobalRankingOpen(false)}
        onWatchReplay={(moves, name, scramble) => {
          setIsGlobalRankingOpen(false);
          handleWatchReplay(moves, name, scramble);
        }}
      />
    </div>
  );
}

export default App;
