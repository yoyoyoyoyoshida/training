import React, { useState, useRef, useEffect } from 'react';
import { Move } from '../utils/cubeState';
import { GripHorizontal } from 'lucide-react';

interface FlickButtonProps {
  base: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  topRight?: string;
  disabled?: boolean;
  onSelect: (move: string) => void;
  isRot?: boolean; 
}

function FlickButton({ base, top, left, right, bottom, topRight, disabled, onSelect, isRot }: FlickButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selection, setSelection] = useState<string>(base);
  const startPos = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const startInteraction = (x: number, y: number) => {
    if (disabled) return;
    setIsActive(true);
    setSelection(base);
    startPos.current = { x, y };
  };

  const moveInteraction = (x: number, y: number) => {
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
    onSelect(selection);
  };

  const Petal = ({ label, angle }: { label?: string, angle: number | 'center' }) => {
    if (!label) return null;
    const isSelected = selection === label;
    const visible = isActive || isHovered;

    const radius = 60; 
    const isCenter = angle === 'center';
    
    const cos = isCenter ? 0 : Math.cos(((angle as number) * Math.PI) / 180);
    const sin = isCenter ? 0 : Math.sin(((angle as number) * Math.PI) / 180);

    const posStyles: React.CSSProperties = {
      position: 'absolute',
      width: isCenter ? '50px' : '40px',
      height: isCenter ? '50px' : '40px',
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isSelected ? 'var(--accent-blue)' : (isCenter ? '#1a1a1a' : '#fff'),
      color: isSelected ? '#fff' : (isCenter ? '#fff' : '#000'),
      fontWeight: 800, 
      fontSize: isCenter ? '1.1rem' : '0.8rem',
      boxShadow: isSelected ? '0 0 20px var(--accent-blue)' : '0 4px 10px rgba(0,0,0,0.4)',
      opacity: visible ? 1 : 0, 
      transform: isCenter 
        ? 'translate(-50%, -50%)' 
        : `translate(calc(-50% + ${cos * radius}px), calc(-50% + ${sin * radius}px)) scale(${isSelected ? 1.1 : 1})`,
      transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
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
      style={{ position: 'relative', width: '100%', height: '54px' }}
      onPointerEnter={() => !disabled && setIsHovered(true)}
      onPointerMove={(e) => !isActive && isHovered && moveInteraction(e.clientX, e.clientY)}
      onPointerLeave={() => { setIsHovered(false); setSelection(base); }}
    >
      <button
        ref={buttonRef}
        className={`virtual-btn ${isRot ? 'rot-btn' : ''}`}
        disabled={disabled}
        style={{ 
          width: '100%', height: '100%', position: 'absolute', zIndex: (isActive || isHovered) ? 10 : 1, touchAction: 'none',
          borderRadius: '500px',
          background: isHovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.1)'
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
        <span style={{ 
          opacity: (isActive || isHovered) ? 0 : 1, 
          transition: 'opacity 0.1s',
          fontSize: '1.1rem',
          fontWeight: 800
        }}>{base}</span>
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
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 380 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const padRef = useRef<HTMLDivElement>(null);

  // 初回配置を調整（画面右下付近）
  useEffect(() => {
    const isMobile = window.innerWidth <= 600;
    setPosition({
      x: isMobile ? (window.innerWidth - 300) / 2 : window.innerWidth - 420,
      y: isMobile ? window.innerHeight - 360 : window.innerHeight - 400
    });
  }, []);

  const handleDragStart = (e: React.PointerEvent) => {
    if (padRef.current) {
      const rect = padRef.current.getBoundingClientRect();
      dragStartOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragStartOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 300, e.clientY - dragStartOffset.current.y))
      });
    }
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const baseMoves = ['R', 'L', 'U', 'D', 'F', 'B'];

  return (
    <div 
      ref={padRef}
      className="virtual-pad-floating"
      style={{ 
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '300px',
        background: 'rgba(15, 15, 15, 0.75)',
        backdropFilter: 'blur(15px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        padding: '0.8rem',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none'
      }}
    >
      {/* Drag Handle */}
      <div 
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          padding: '4px', cursor: 'grab', marginBottom: '8px', color: 'rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.05)', borderRadius: '12px'
        }}
      >
        <GripHorizontal size={20} />
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.8rem' }}>
        {['x', 'y', 'z'].map(rot => (
          <button 
            key={rot} 
            className="virtual-btn rot-btn" 
            onClick={() => onInputMove(rot as Move)}
            disabled={disabled}
            style={{ height: '36px', fontSize: '0.8rem', borderRadius: '12px' }}
          >
            {rot}
          </button>
        ))}
      </div>
    </div>
  );
}
