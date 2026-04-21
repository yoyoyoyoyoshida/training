import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';

interface ResultModalProps {
  isOpen: boolean;
  timeMs: number;
  moveCount: number;
  user: User | null;
  initialName: string;
  onClose: () => void;
  onSubmit: (displayName: string) => void;
}

export function ResultModal({ isOpen, timeMs, moveCount, user, initialName, onClose, onSubmit }: ResultModalProps) {
  const [displayName, setDisplayName] = useState(initialName);

  useEffect(() => {
    setDisplayName(initialName);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const formatTime = (ms: number) => (ms / 1000).toFixed(2);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: '#111',
        border: '1px solid var(--card-border)',
        borderRadius: '24px',
        padding: '2.5rem',
        width: '90%',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ color: 'var(--accent-green)', fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.2em' }}>
          CONGRATULATIONS!
        </div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 900 }}>CLEAR!</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>TIME</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace' }}>{formatTime(timeMs)}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>MOVES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace' }}>{moveCount}</div>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block', fontWeight: 700 }}>
            RANKING DISPLAY NAME
          </label>
          <input 
            type="text" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="名前を入力..."
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
          />
          {!user && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              ※ログインしていないため「ゲスト」として登録されます。
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            className="primary-btn" 
            style={{ width: '100%', padding: '1.2rem', backgroundColor: 'var(--accent-blue)' }}
            onClick={() => onSubmit(displayName || 'ゲスト')}
          >
            ランキングに登録
          </button>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            登録せずに閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
