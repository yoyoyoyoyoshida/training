import React, { useState, useEffect } from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export function ProfileModal({ isOpen, currentName, onClose, onSave }: ProfileModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid var(--card-border)',
        borderRadius: '20px',
        padding: '2rem',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 15px 40px rgba(0,0,0,0.6)'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
          ランキング表示名を設定
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          ※この名前は後からいつでも変更可能です。
        </p>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
            RANKING DISPLAY NAME
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              background: '#000',
              border: '2px solid var(--accent-green)',
              borderRadius: '12px',
              padding: '1rem',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 700,
              outline: 'none'
            }}
            placeholder="お名前を入力..."
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="primary-btn" 
            style={{ flex: 1, backgroundColor: 'var(--accent-blue)', padding: '0.8rem' }}
            onClick={() => onSave(name)}
          >
            保存する
          </button>
          <button 
            style={{ flex: 1, background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            onClick={onClose}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
