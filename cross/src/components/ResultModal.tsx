import { useState, useEffect } from 'react';

interface ResultModalProps {
  isOpen: boolean;
  timeMs: number;
  moveCount: number;
  user: any;
  initialName: string;
  onClose: () => void;
  onSubmit: (displayName: string) => void;
  isTrainingMode?: boolean;
  trainingStats?: {
    totalSessions: number;
    rank: number;
    totalUsers: number;
  } | null;
  onLogin?: () => void;
}

export function ResultModal({ 
  isOpen, timeMs, moveCount, user, initialName, onClose, onSubmit, 
  isTrainingMode, trainingStats, onLogin 
}: ResultModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const formatTime = (ms: number) => (ms / 1000).toFixed(2);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: '#111',
        border: '1px solid var(--card-border)',
        borderRadius: '24px',
        padding: '2.5rem',
        width: '90%',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
      }}>
        {isTrainingMode ? (
          <>
            <img src="./logo.svg" alt="Logo" style={{ width: '64px', height: '64px', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent-green)' }}>
              TRAINING DONE!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              ナイス練習！着実に実力がついています。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>TIME</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatTime(timeMs)}s</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>MOVES</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{moveCount}</div>
              </div>
            </div>

            {user ? (
              <div style={{ background: 'rgba(50,205,50,0.1)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(50,205,50,0.2)', marginBottom: '2rem' }}>
                {trainingStats ? (
                  <>
                    <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      今月 <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>{trainingStats.totalSessions}</span> 回目の達成です！
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      現在、{trainingStats.totalUsers}人中 <span style={{ fontWeight: 800, color: '#fff' }}>{trainingStats.rank}位</span> です
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.8rem' }}>記録を更新中...</div>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Googleログインすると、トレーニング回数を記録してランキングに参加できます。
                </p>
                <button className="primary-btn" onClick={onLogin} style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', width: 'auto' }}>
                  ログインして記録を残す
                </button>
              </div>
            )}

            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              ※トレーニングモードは自動で記録されます
            </p>

            <button className="primary-btn" onClick={onClose} style={{ width: '100%', padding: '1rem' }}>
              次へ進む
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>
              SOLVED!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              素晴らしい！スコアをランキングに登録しましょう。
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>TIME</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatTime(timeMs)}s</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>MOVES</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{moveCount}</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                RANKING DISPLAY NAME
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  background: '#000',
                  border: '2px solid var(--card-border)',
                  borderRadius: '12px',
                  padding: '1rem',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
                placeholder="名前を入力..."
              />
            </div>

            <button className="primary-btn" onClick={() => onSubmit(name)} style={{ width: '100%', padding: '1rem' }}>
              ランキングに登録して終了
            </button>
          </>
        )}
      </div>
    </div>
  );
}
