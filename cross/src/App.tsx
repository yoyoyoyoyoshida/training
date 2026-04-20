import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

import { RubiksCube } from './components/RubiksCube';
import { createInitialState, parseMoveString, performMoves, performMove, Move } from './utils/cubeState';
import { checkCrossSolved } from './utils/crossValidator';
import { VirtualPad } from './components/VirtualPad';
import { RankingBoard } from './components/RankingBoard';
import { useAuth } from './hooks/useAuth';
import { getDailyScramble } from './utils/scrambleGenerator';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';

type GameStatus = 'IDLE' | 'PLAYING' | 'SOLVED';

function App() {
  const { user, login } = useAuth();
  const [cubies, setCubies] = useState(() => performMove(createInitialState(), 'x2'));
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [currentBatchId, setCurrentBatchId] = useState(() => getDailyScramble().batchId);
  const [moveCount, setMoveCount] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const timerRef = useRef<number | null>(null);

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
        
        // Save score if logged in
        if (user) {
          addDoc(collection(db, 'scores'), {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            moveCount: moveCount,
            timeTaken: timeMs,
            batchId: currentBatchId,
            createdAt: serverTimestamp(),
          }).catch(err => console.error("Score save failed:", err));
        }
      }
    }
  }, [cubies, status, user, moveCount, timeMs, currentBatchId]);

  const handleInputMove = (move: Move) => {
    if (status === 'SOLVED') return;

    // x, y, z などの全体持ち替え以外は全て物理手（1手）としてカウント
    const mCore = move.replace(/['2\sw]/gi, '').toLowerCase();
    const isPhysical = !['x', 'y', 'z'].includes(mCore) && mCore.length > 0;

    if (status === 'IDLE' && isPhysical) {
      startTimer();
    }

    setCubies(prev => performMove(prev, move));
    if (isPhysical) {
      setMoveCount(prev => prev + 1);
    }
  };

  const handleRandomScramble = () => {
    const basicMoves = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"];
    const scramble = Array.from({ length: 15 }, () => basicMoves[Math.floor(Math.random() * basicMoves.length)]);
    
    stopTimer();
    const initialState = performMove(createInitialState(), 'x2');
    setCubies(performMoves(initialState, scramble));
    setStatus('IDLE');
    setMoveCount(0);
    setTimeMs(0);
    setCurrentBatchId('FREE_PRACTICE_' + Date.now()); // Free practice moves get random unique batch so they don't corrupt daily rankings
  };

  const handleDailyScramble = () => {
    const daily = getDailyScramble();
    stopTimer();
    const initialState = performMove(createInitialState(), 'x2');
    setCubies(performMoves(initialState, daily.scramble));
    setStatus('IDLE');
    setMoveCount(0);
    setTimeMs(0);
    setCurrentBatchId(daily.batchId);
  };

  const formatTime = (ms: number) => (ms / 1000).toFixed(2);

  return (
    <>
      <header className="app-header">
        <div className="brand">
          Cross <span className="brand-accent">Practice</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <img src={user.photoURL || ''} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--accent-blue)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user.displayName}</span>
            </div>
          ) : (
            <button className="primary-btn" onClick={login} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              Googleでログイン
            </button>
          )}
          <a href="/training/" className="back-link">← ポータルへ戻る</a>
        </div>
      </header>

      <div className="main-content">
        <div className="scene-container">
          <Canvas camera={{ position: [5, 5, 8], fov: 45 }}>
            <color attach="background" args={['#050505']} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 10, 7]} intensity={0.5} />
            <RubiksCube cubies={cubies} />
            <OrbitControls enablePan={false} />
          </Canvas>
        </div>

        <div className="controls-panel">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>TIME</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff', lineHeight: 1 }}>{formatTime(timeMs)}<span style={{fontSize:'1rem'}}>s</span></div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>MOVES</div>
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="primary-btn" 
            onClick={handleDailyScramble}
            style={{ flex: 1.5, background: 'var(--accent-green)', color: '#000' }}
          >
            最新の課題 (全国共通)
          </button>
          <button 
            className="primary-btn" 
            onClick={handleRandomScramble}
            style={{ flex: 1, background: '#333', fontSize: '0.9rem' }}
          >
            フリートレーニング
          </button>
        </div>

        <VirtualPad onInputMove={handleInputMove} disabled={status === 'SOLVED'} />
        
        <RankingBoard batchId={currentBatchId} />
      </div>
    </div>
  </>
);
}

export default App;
