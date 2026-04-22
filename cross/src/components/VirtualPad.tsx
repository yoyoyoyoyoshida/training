import { useState, useRef } from 'react';
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
          borderRadius: '12px',
          background: isHovered ? (isCancelArea ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.05)',
          border: isCancelArea ? '1px solid rgba(255,0,0,0.5)' : '1px solid rgba(255,255,255,0.1)',
          color: isCancelArea ? '#ff4444' : '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
          transition: 'all 0.2s'
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

  return (
    <div style={{ 
      width: '100%',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.8rem',
      marginTop: '1rem'
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '0.1em' }}>VIRTUAL INPUT</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
        {baseMoves.map(base => (
          <FlickButton 
            key={base} base={base} 
            left={`${base}'`} top={`${base}2`} right={`${base}w`} bottom={`${base}w'`} topRight={`${base}w2`}
            onSelect={onInputMove} disabled={disabled}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.4rem' }}>
        {['x', 'y', 'z'].map(rot => (
          <button 
            key={rot} 
            onClick={() => onInputMove(rot as Move)}
            disabled={disabled}
            style={{ 
              height: '32px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer'
            }}
          >
            {rot}
          </button>
        ))}
      </div>
    </div>
  );
}
