import {} from 'react';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DailyChallengeModal({ isOpen, onClose, onConfirm, isLoading }: DailyChallengeModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 4000, backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: '#000',
        border: '2px solid var(--accent-blue)',
        borderRadius: '24px',
        padding: '2.5rem',
        width: '90%',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: '0 0 50px rgba(0, 122, 255, 0.3)'
      }}>
        <img src="./logo.svg" alt="Logo" style={{ width: '80px', height: '80px', marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem', color: '#fff' }}>
          真剣勝負です！
        </h2>
        
        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <ul style={{ margin: 0, padding: '0 0 0 1.2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li><strong style={{ color: '#fff' }}>やり直し不可</strong>: 開始すると、ブラウザバックやリロードをしても本日の挑戦はできなくなります。</li>
            <li><strong style={{ color: '#fff' }}>手数勝負</strong>: 最も短い手数で解いた人が上位にランクインします。</li>
            <li><strong style={{ color: '#fff' }}>フリック操作</strong>: 回転記号を間違えないように注意してください。</li>
          </ul>
        </div>

        <p style={{ fontWeight: 800, marginBottom: '2rem', fontSize: '1.1rem' }}>
          準備は整いましたか？
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            className="primary-btn" 
            onClick={onConfirm}
            disabled={isLoading}
            style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', background: 'var(--accent-blue)' }}
          >
            {isLoading ? '通信中...' : '挑戦を開始する'}
          </button>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            やめておく
          </button>
        </div>
      </div>
    </div>
  );
}
