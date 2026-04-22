import { useState, useRef, useEffect } from 'react';
import { Move } from '../utils/cubeState';

interface FlickButtonProps {
  base: string;
  moves: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    topRight: string;
    bottomRight: string;
    topLeft: string;
    bottomLeft: string;
  };
  onSelect: (move: Move) => void;
  disabled: boolean;
  isHorizontal?: boolean;
}

function FlickButton({ base, moves, onSelect, disabled, isHorizontal = false }: FlickButtonProps) {
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const THRESHOLD = 20;

  const getDirection = (dx: number, dy: number) => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < THRESHOLD) return null;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (isHorizontal) {
      // 横長配置: 右(0), 右下(60), 左下(120), 左(180), 左上(-120), 右上(-60)
      if (angle >= -30 && angle < 30) return 'right';
      if (angle >= 30 && angle < 90) return 'bottomRight';
      if (angle >= 90 && angle < 150) return 'bottomLeft';
      if (angle >= 150 || angle < -150) return 'left';
      if (angle >= -150 && angle < -90) return 'topLeft';
      if (angle >= -90 && angle < -30) return 'topRight';
    } else {
      // 縦長配置: 上(-90), 下(90), 右上(-30), 右下(30), 左上(-150), 左下(150)
      if (angle >= -120 && angle < -60) return 'top';
      if (angle >= 60 && angle < 120) return 'bottom';
      if (angle >= -60 && angle < 0) return 'topRight';
      if (angle >= 0 && angle < 60) return 'bottomRight';
      if (angle >= -180 && angle < -120) return 'topLeft';
      if (angle >= 120 || angle < -150) return 'bottomLeft';
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    buttonRef.current?.setPointerCapture(e.pointerId);
    setStartPos({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
    setActiveDir(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    setActiveDir(getDirection(dx, dy));
  };

  const handlePointerUp = () => {
    if (isDragging && activeDir) {
      const move = (moves as any)[activeDir];
      if (move) onSelect(move as Move);
    }
    setIsDragging(false);
    setActiveDir(null);
  };

  const Petal = ({ dir, label, angle }: { dir: string; label: string; angle: number }) => {
    const isActive = activeDir === dir;
    const rad = (angle * Math.PI) / 180;
    const dist = isDragging ? (isActive ? 48 : 42) : 0; 
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist;

    return (
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${isDragging ? 1 : 0})`,
        width: '32px',
        height: '32px',
        background: isActive ? 'var(--accent-green)' : 'rgba(20, 20, 20, 0.9)',
        border: `1.5px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.2)'}`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 900,
        color: isActive ? '#000' : '#fff',
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        boxShadow: isActive ? '0 0 15px var(--accent-green)' : '0 4px 10px rgba(0,0,0,0.5)',
        zIndex: isActive ? 100 : 1,
        opacity: isDragging ? 1 : 0
      }}>
        {label}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
        disabled={disabled}
        style={{
          width: isDragging ? '75%' : '85%',
          height: isDragging ? '75%' : '85%',
          background: isDragging ? 'rgba(50,205,50,0.2)' : 'rgba(255,255,255,0.1)',
          border: `1.5px solid ${isDragging ? 'var(--accent-green)' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: '50%',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          boxShadow: isDragging ? '0 0 20px rgba(50,205,50,0.3)' : 'none',
          zIndex: isDragging ? 50 : 1
        }}
      >
        <span style={{ fontSize: '1rem', fontWeight: 900, color: isDragging ? 'var(--accent-green)' : '#fff', opacity: 0.9 }}>
          {base}
        </span>
      </button>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {isHorizontal ? (
          <>
            <Petal dir="left" label={moves.left!} angle={180} />
            <Petal dir="right" label={moves.right!} angle={0} />
            <Petal dir="topLeft" label={moves.topLeft} angle={-120} />
            <Petal dir="topRight" label={moves.topRight} angle={-60} />
            <Petal dir="bottomLeft" label={moves.bottomLeft} angle={120} />
            <Petal dir="bottomRight" label={moves.bottomRight} angle={60} />
          </>
        ) : (
          <>
            <Petal dir="top" label={moves.top!} angle={-90} />
            <Petal dir="bottom" label={moves.bottom!} angle={90} />
            <Petal dir="topRight" label={moves.topRight} angle={-30} />
            <Petal dir="bottomRight" label={moves.bottomRight} angle={30} />
            <Petal dir="topLeft" label={moves.topLeft} angle={-150} />
            <Petal dir="bottomLeft" label={moves.bottomLeft} angle={150} />
          </>
        )}
      </div>
    </div>
  );
}

interface VirtualPadProps {
  onInputMove: (move: Move) => void;
  disabled: boolean;
}

export function VirtualPad({ onInputMove, disabled }: VirtualPadProps) {
  const baseMoves = ['L', 'U', 'R', 'F', 'D', 'B'];
  const [pos, setPos] = useState({ x: 0, y: 0 }); 
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const getMovesForBase = (base: string) => {
    const isR = base === 'R';
    const isU = base === 'U';
    const isFDB = ['F', 'D', 'B'].includes(base);
    
    if (isU) {
      return {
        left: 'U',
        right: "U'",
        topRight: 'U2',
        bottomRight: 'Uw2',
        topLeft: 'Uw',
        bottomLeft: "Uw'"
      };
    }

    if (isFDB) {
      const isB = base === 'B';
      return {
        left: isB ? `${base}` : `${base}'`,
        right: isB ? `${base}'` : `${base}`,
        topRight: `${base}2`,
        bottomRight: `${base}w2`,
        topLeft: `${base}w`,
        bottomLeft: `${base}w'`
      };
    }
    
    return {
      top: isR ? `${base}` : `${base}'`,
      bottom: isR ? `${base}'` : `${base}`,
      topRight: `${base}2`,
      bottomRight: `${base}w2`,
      topLeft: `${base}w`,
      bottomLeft: `${base}w'`
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth <= 768) return; 
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="virtual-pad-balloon"
      style={{ 
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        cursor: isDragging ? 'grabbing' : 'auto',
        padding: '1rem'
      }}
    >
      <div 
        onMouseDown={handleMouseDown}
        style={{ 
          fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 900, 
          letterSpacing: '0.1em', marginBottom: '0.8rem', cursor: 'grab',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          userSelect: 'none', opacity: 0.8
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>⠿</span> 操作パネル
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '4px', // 隙間を極限まで詰める
        maxWidth: '240px', // パネル全体の幅を抑える
        margin: '0 auto'
      }}>
        {baseMoves.map(base => (
          <FlickButton 
            key={base} base={base} 
            moves={getMovesForBase(base)}
            onSelect={onInputMove} disabled={disabled}
            isHorizontal={['U', 'F', 'D', 'B'].includes(base)}
          />
        ))}
      </div>

      <div style={{ marginTop: '0.8rem' }}>
        <div style={{ 
          fontSize: '0.6rem', color: 'var(--text-secondary)', 
          marginBottom: '0.4rem', textAlign: 'center', opacity: 0.7 
        }}>
          ※持ち替え（x, y, z）は手数に含まれません
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
          {['x', 'y', 'z'].map(rot => (
            <button 
              key={rot} 
              onClick={() => onInputMove(rot as Move)}
              disabled={disabled}
              style={{ 
                height: '30px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              {rot}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
