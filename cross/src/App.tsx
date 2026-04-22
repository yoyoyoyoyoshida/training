import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

import { RubiksCube } from './components/RubiksCube';
import { createInitialState, parseMoveString, performMoves, performMove, Move } from './utils/cubeState';
import { checkCrossSolved } from './utils/crossValidator';
import { VirtualPad } from './components/VirtualPad';
import { RankingBoard } from './components/RankingBoard';
import { ResultModal } from './components/ResultModal';
import { ProfileModal } from './components/ProfileModal';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { getDailyScramble } from './utils/scrambleGenerator';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';
import { GlobalRankingModal } from './components/GlobalRankingModal';

type GameStatus = 'IDLE' | 'PLAYING' | 'SOLVED';

function App() {
  const { user, login } = useAuth();
  const { profileName, updateProfileData, isNewUser } = useProfile(user);
  const [isLogoHover, setIsLogoHover] = useState(false);
  
  const [cubies, setCubies] = useState(() => performMove(createInitialState(), 'x2'));
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [currentBatchId, setCurrentBatchId] = useState(() => getDailyScramble().batchId);
  const [moveCount, setMoveCount] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [moveLog, setMoveLog] = useState<Move[]>([]); 
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGlobalRankingOpen, setIsGlobalRankingOpen] = useState(false);
  const [replayData, setReplayData] = useState<{ moves: Move[], userName: string } | null>(null);
  const [currentScramble, setCurrentScramble] = useState<string[]>([]);
  const [hasCompletedDaily, setHasCompletedDaily] = useState(false); // 追加：今日の課題をクリアしたか
  const timerRef = useRef<number | null>(null);
  const replayRef = useRef<boolean>(false);

  // 初回ログイン時に名前設定モーダルを強制表示
  useEffect(() => {
    if (isNewUser) {
      setIsProfileModalOpen(true);
    }
  }, [isNewUser]);

  // 今日の課題をクリア済みかチェックする
  useEffect(() => {
    if (user && currentBatchId.startsWith('DAILY_')) {
      const checkCompletion = async () => {
        const q = query(
          collection(db, 'scores'),
          where('userId', '==', user.uid),
          where('batchId', '==', currentBatchId)
        );
        const snap = await getDocs(q);
        setHasCompletedDaily(!snap.empty);
      };
      checkCompletion();
    } else {
      setHasCompletedDaily(false);
    }
  }, [user, currentBatchId]);

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

  // Check solve status securely when state updates
  useEffect(() => {
    if (status === 'PLAYING') {
      const isSolved = checkCrossSolved(cubies, 'WHITE') || checkCrossSolved(cubies, 'YELLOW');
      if (isSolved) {
        setStatus('SOLVED');
        stopTimer();
        setTimeout(() => setIsResultModalOpen(true), 500); // 完了の余韻のために少し遅らせる
      }
    }
  }, [cubies, status]);

  const handleResultSubmit = async (displayName: string) => {
    // スコア保存
    try {
      await addDoc(collection(db, 'scores'), {
        userId: user?.uid || 'guest_' + Date.now(),
        userName: displayName,
        moveCount: moveCount,
        timeTaken: timeMs,
        moveLog: moveLog,
        scramble: currentScramble, // スクランブルも保存
        batchId: currentBatchId,
        createdAt: serverTimestamp(),
      });

      if (user) {
        await updateProfileData(user.uid, displayName);
        // 今日の課題ならクリアフラグを立てる
        if (currentBatchId.startsWith('DAILY_')) {
          setHasCompletedDaily(true);
        }
      }
      
      setIsResultModalOpen(false);
    } catch (err) {
      console.error("Score save failed:", err);
      alert("保存に失敗しました。ルール設定等を確認してください。");
    }
  };

  const handleProfileSave = async (newName: string) => {
    if (user) {
      await updateProfileData(user.uid, newName);
      setIsProfileModalOpen(false);
    }
  };

  const handleWatchReplay = async (moves: string[], solveName: string, scramble: string[]) => {
    // 権限制限チェック
    if (!user) {
      alert("リプレイを視聴するにはGoogleログインが必要です。");
      return;
    }
    if (!hasCompletedDaily) {
      alert("まずはご自身で「本日の1発勝負」をクリアして、スコアを登録してください！（ネタバレ防止のため）");
      return;
    }

    // リプレイ開始：まず問題を再現
    stopTimer();
    replayRef.current = true;
    const initialState = performMove(createInitialState(), 'x2');
    setCubies(performMoves(initialState, scramble));
    setStatus('IDLE');
    setMoveCount(0);
    setTimeMs(0);
    setReplayData({ moves, userName: solveName });

    // 1手ずつ再生
    let currentCube = performMoves(initialState, scramble);
    for (let i = 0; i < moves.length; i++) {
      // 途中で停止ボタンが押された（replayRefがfalseになった）ら中断
      if (!replayRef.current) break; 
      
      await new Promise(r => setTimeout(r, 800)); // 再生速度を少し調整
      
      // 再度チェック
      if (!replayRef.current) break;

      const m = moves[i];
      currentCube = performMove(currentCube, m);
      setCubies([...currentCube]); // 正しい配列展開記法に修正
      setMoveCount(i + 1);
    }
    
    // 終了後に少し待ってリプレイモードをクリア
    setTimeout(() => {
      setReplayData(null);
      replayRef.current = false;
    }, 2000);
  };

  const handleInputMove = (move: Move) => {
    if (status === 'SOLVED' || replayData) return; // リプレイ中はガード

    // x, y, z などの全体持ち替え以外は全て物理手（1手）としてカウント
    const mCore = move.replace(/['2\sw]/gi, '').toLowerCase();
    const isPhysical = !['x', 'y', 'z'].includes(mCore) && mCore.length > 0;

    if (status === 'IDLE' && isPhysical) {
      startTimer();
    }

    setCubies(prev => performMove(prev, move));
    if (isPhysical) {
      setMoveCount(prev => prev + 1);
      setMoveLog(prev => [...prev, move]); // ログに追加
    } else {
      setMoveLog(prev => [...prev, move]); // 持ち替えもリプレイ再現のために保存
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

  const handleDailyScramble = () => {
    const daily = getDailyScramble();
    resetGameStates();
    const initialState = performMove(createInitialState(), 'x2');
    setCubies(performMoves(initialState, daily.scramble));
    setCurrentScramble(daily.scramble);
    setStatus('IDLE');
    setCurrentBatchId(daily.batchId);
  };

  const formatTime = (ms: number) => (ms / 1000).toFixed(2);

  return (
    <>
      <header className="app-header">
        <div 
          className="brand"
          onMouseEnter={() => setIsLogoHover(true)}
          onMouseLeave={() => setIsLogoHover(false)}
          style={{ cursor: 'pointer' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isLogoHover ? 'rotate(240deg)' : 'rotate(0deg)',
            }}
          >
            {/* Red Segment */}
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#ff0000" strokeDasharray="12.16 48.64" strokeDashoffset="0" />
            {/* Blue Segment */}
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#0055ff" strokeDasharray="12.16 48.64" strokeDashoffset="-12.16" />
            {/* Orange Segment */}
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#ff8800" strokeDasharray="12.16 48.64" strokeDashoffset="-24.32" />
            {/* Green Segment */}
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#00bb00" strokeDasharray="12.16 48.64" strokeDashoffset="-36.48" />
            {/* Yellow Segment */}
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#ffe600" strokeDasharray="12.16 48.64" strokeDashoffset="-48.64" />
            {/* Y Inner */}
            <path d="M12 12.5V19M12 12.5L6 9M12 12.5L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Cross <span className="brand-accent">Practice</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <button 
            className="ranking-trigger-btn" 
            onClick={() => setIsGlobalRankingOpen(true)}
            title="ランキングを表示"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34"></path>
              <path d="M12 22v-4"></path>
              <path d="M17 4H7a2 2 0 0 0-2 2v3a7 7 0 0 0 14 0V6a2 2 0 0 0-2-2Z"></path>
            </svg>
            <span className="hide-on-mobile" style={{ marginLeft: '0.5rem' }}>ランキング</span>
          </button>
          {user ? (
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.8rem', 
                cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              className="header-user-profile"
            >
              <img src={user.photoURL || ''} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--accent-blue)' }} />
              <div className="hide-on-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>{profileName}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>クリックで名前変更</span>
              </div>
            </div>
          ) : (
            <button className="primary-btn" onClick={login} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              Googleでログイン
            </button>
          )}
          <a href="/training/" className="back-link">
            <span className="hide-on-mobile">← ポータルへ戻る</span>
            <span className="show-only-mobile">← 戻る</span>
          </a>
        </div>
      </header>

      <div className="main-content">
        <div className="scene-container">
          <div className="stats-overlay">
            <div className="stat-card">
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 800 }}>TIME</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace' }}>{formatTime(timeMs)}</span>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 800 }}>MOVES</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace' }}>{moveCount}</span>
            </div>
          </div>
          <Canvas camera={{ position: [6, 6, 12], fov: 45 }}>
            <color attach="background" args={['#050505']} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 10, 7]} intensity={0.5} />
            <RubiksCube cubies={cubies} />
            <OrbitControls enablePan={false} />
          </Canvas>
        </div>

        <div className="controls-panel">
          {/* PC用統計パネル (モバイルではCSSで非表示) */}
          <div className="hide-on-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>TIME</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff', lineHeight: 1 }}>{formatTime(timeMs)}<span style={{fontSize:'1rem'}}>s</span></div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                <span>MOVES</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 400 }}>(持ち替えを除く)</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff', lineHeight: 1 }}>{moveCount}</div>
            </div>
          </div>

          <div className="control-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span>Status</span>
              {status === 'SOLVED' && <span style={{ color: '#32cd32' }}>✓ CLEAR!</span>}
              {status === 'PLAYING' && <span style={{ color: 'var(--accent-blue)' }}>● PLAYING</span>}
              {status === 'IDLE' && <span style={{ color: 'var(--text-secondary)' }}>- IDLE</span>}
            </label>
          </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="primary-btn" 
            onClick={handleDailyScramble}
            style={{ flex: '1.5 0 200px', background: 'var(--accent-green)', color: '#000' }}
          >
            本日の1発勝負<br /><span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(全国共通)</span>
          </button>
          <button 
            className="primary-btn" 
            onClick={handleRandomScramble}
            style={{ flex: '1 0 150px', background: '#333', fontSize: '0.9rem' }}
          >
            トレーニング
          </button>
        </div>

        <VirtualPad onInputMove={handleInputMove} disabled={status === 'SOLVED' || !!replayData} />

        <div className="hide-on-mobile">
          <RankingBoard 
            batchId={currentBatchId} 
            onWatchReplay={(moves, name, scramble) => {
              handleWatchReplay(moves, name, scramble);
            }} 
          />
        </div>

        <footer style={{ 
          textAlign: 'center', 
          padding: '1.5rem 0 0.5rem', 
          marginTop: 'auto',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ marginBottom: '0.4rem' }}>&copy; 2026 GACHI-CUBE Training</div>
          <a 
            href="/training/privacy.html" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}
          >
            プライバシーポリシー
          </a>
        </footer>
      </div>

      {replayData && (
        <div style={{
          position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,122,255,0.9)', color: '#fff', padding: '1rem 2rem',
          borderRadius: '50px', fontWeight: 800, zIndex: 1000, display: 'flex', gap: '1rem',
          alignItems: 'center', boxShadow: '0 10px 30px rgba(0,122,255,0.4)',
          border: '2px solid #fff'
        }}>
          <span className="pulse">● REPLAYING</span>
          <span>{replayData.userName}'s Solve</span>
          <button 
            onClick={() => {
              setReplayData(null);
              replayRef.current = false;
            }}
            style={{ background: '#fff', color: 'var(--accent-blue)', border: 'none', borderRadius: '20px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}
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
      />
      <ProfileModal 
        isOpen={isProfileModalOpen}
        currentName={profileName}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleProfileSave}
      />



      <GlobalRankingModal 
        isOpen={isGlobalRankingOpen}
        onClose={() => setIsGlobalRankingOpen(false)}
        onWatchReplay={(moves, name, scrambleStr) => {
          setIsGlobalRankingOpen(false);
          handleWatchReplay(moves, name, scrambleStr.split(' '));
        }}
      />
    </div>
  </>
);
}

export default App;
