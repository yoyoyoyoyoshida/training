import { useState, useRef, useEffect } from 'react';
import { Move } from '../utils/cubeState';

interface FlickButtonProps {
  base: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  topRight?: string;
  disabled?: boolean;
  onSelect: (move: string) => void;
}

function FlickButton({ base, top, left, right, bottom, topRight, disabled, onSelect }: FlickButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selection, setSelection] = useState<string | null>(base);
  const [isCancelArea, setIsCancelArea] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // キャンセル判定のしきい値
  const CANCEL_DISTANCE = 140;

  const startInteraction = (x: number, y: number) => {
    if (disabled) return;
    setIsActive(true);
    setSelection(base);
    setIsCancelArea(false);
    startPos.current = { x, y };
  };

  const moveInteraction = (x: number, y: number) => {
    if (disabled) {
      if (isActive) setIsActive(false);
      return;
    }
    if (!isActive && !isHovered) return;

    let dx, dy;
    if (isActive) {
      dx = x - startPos.current.x;
      dy = y - startPos.current.y;
    } else {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      dx = x - (rect.left + rect.width / 2);
      dy = y - (rect.top + rect.height / 2);
    }
    
    const distance = Math.hypot(dx, dy);

    // キャンセル圏外チェック
    if (distance > CANCEL_DISTANCE) {
      setIsCancelArea(true);
      setSelection(null);
      return;
    }

    setIsCancelArea(false);
    let current = base;
    if (distance > 20) {
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const normalizedAngle = (angle < 0 ? angle + 360 : angle);
      
      if (normalizedAngle >= 234 && normalizedAngle < 306) { if(top) current = top; }
      else if (normalizedAngle >= 306 || normalizedAngle < 18) { if(topRight) current = topRight; }
      else if (normalizedAngle >= 18 && normalizedAngle < 90) { if(right) current = right; }
      else if (normalizedAngle >= 90 && normalizedAngle < 162) { if(bottom) current = bottom; }
      else if (normalizedAngle >= 162 && normalizedAngle < 234) { if(left) current = left; }
    }
    setSelection(current);
  };

  const endInteraction = () => {
    if (!isActive) return;
    setIsActive(false);
    
    // 選択状態かつキャンセルエリアでない場合のみ実行
    if (selection && !isCancelArea) {
      onSelect(selection);
    }
    setSelection(base);
    setIsCancelArea(false);
  };

  const Petal = ({ label, angle }: { label?: string, angle: number | 'center' }) => {
    if (!label) return null;
    const isSelected = selection === label && !isCancelArea;
    const visible = isActive || isHovered;

    const radius = 50; 
    const isCenter = angle === 'center';
    
    const cos = isCenter ? 0 : Math.cos(((angle as number) * Math.PI) / 180);
    const sin = isCenter ? 0 : Math.sin(((angle as number) * Math.PI) / 180);

    const posStyles: React.CSSProperties = {
      position: 'absolute',
      width: isCenter ? '44px' : '36px',
      height: isCenter ? '44px' : '36px',
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isSelected ? 'var(--accent-blue)' : (isCenter ? '#222' : '#fff'),
      color: isSelected ? '#fff' : (isCenter ? '#fff' : '#000'),
      fontWeight: 800, 
      fontSize: isCenter ? '1rem' : '0.75rem',
      boxShadow: isSelected ? '0 0 15px var(--accent-blue)' : '0 2px 8px rgba(0,0,0,0.4)',
      opacity: visible ? (isCancelArea ? 0.3 : 1) : 0, 
      transform: isCenter 
        ? 'translate(-50%, -50%)' 
        : `translate(calc(-50% + ${cos * radius}px), calc(-50% + ${sin * radius}px)) scale(${isSelected ? 1.1 : 1})`,
      transition: 'all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      pointerEvents: 'none',
      border: isSelected ? '2px solid #fff' : 'none',
      left: '50%',
      top: '50%',
      zIndex: isSelected ? 1000 : 1,
    };

    return <div style={posStyles}>{label}</div>;
  };

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '48px' }}
      onPointerEnter={() => !disabled && setIsHovered(true)}
      onPointerMove={(e) => !isActive && isHovered && moveInteraction(e.clientX, e.clientY)}
      onPointerLeave={() => { setIsHovered(false); setSelection(base); setIsCancelArea(false); }}
    >
      <button
        ref={buttonRef}
        disabled={disabled}
        style={{ 
          width: '100%', height: '100%', position: 'absolute', zIndex: (isActive || isHovered) ? 10 : 1, touchAction: 'none',
          borderRadius: '14px',
          background: isHovered 
            ? (isCancelArea ? 'rgba(255,0,0,0.15)' : 'rgba(50,205,50,0.15)') 
            : 'rgba(255,255,255,0.08)',
          border: isCancelArea 
            ? '1px solid rgba(255,0,0,0.5)' 
            : `1px solid ${isHovered ? 'var(--accent-green)' : 'rgba(255,255,255,0.15)'}`,
          color: isCancelArea ? '#ff4444' : '#fff', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: isHovered && !isCancelArea ? '0 0 15px rgba(50,205,50,0.2)' : 'none'
        }}
        onPointerDown={(e) => {
          buttonRef.current?.setPointerCapture(e.pointerId);
          startInteraction(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (buttonRef.current?.hasPointerCapture(e.pointerId)) moveInteraction(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          buttonRef.current?.releasePointerCapture(e.pointerId);
          endInteraction();
        }}
        onPointerCancel={endInteraction}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span style={{ opacity: (isActive || isHovered) ? 0 : 1 }}>{isCancelArea ? '×' : base}</span>
      </button>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
        <Petal label={top} angle={-90} />
        <Petal label={topRight} angle={-18} />
        <Petal label={right} angle={54} />
        <Petal label={bottom} angle={126} />
        <Petal label={left} angle={198} />
        <Petal label={base} angle="center" />
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
  const [pos, setPos] = useState({ x: 0, y: 0 }); // ドラッグによる相対移動量
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth <= 768) return; // モバイルではドラッグ無効
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
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      <div 
        onMouseDown={handleMouseDown}
        style={{ 
          fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 900, 
          letterSpacing: '0.1em', marginBottom: '1rem', cursor: 'grab',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          userSelect: 'none', opacity: 0.8
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>⠿</span> 操作パネル
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
        {baseMoves.map(base => (
          <FlickButton 
            key={base} base={base} 
            left={`${base}'`} top={`${base}2`} right={`${base}w`} bottom={`${base}w'`} topRight={`${base}w2`}
            onSelect={onInputMove} disabled={disabled}
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
