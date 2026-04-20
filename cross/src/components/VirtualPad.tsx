import React, { useState, useRef } from 'react';
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
    if (!isActive) return;
    const dx = x - startPos.current.x;
    const dy = y - startPos.current.y;
    const distance = Math.hypot(dx, dy);

    let current = base;
    if (distance > 25) {
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      // Define 8-way angular sectors roughly
      if (angle > -30 && angle < 30 && right) current = right; // (Right)
      else if (angle >= -90 && angle <= -30 && topRight) current = topRight; // (Top Right)
      else if (angle < -90 && angle > -150 && top) current = top; // (Top)
      else if (angle > 30 && angle < 150 && bottom) current = bottom; // (Bottom)
      else if (left) current = left; // (Left default for everything else)
    }
    setSelection(current);
  };

  const endInteraction = () => {
    if (!isActive) return;
    setIsActive(false);
    onSelect(selection);
  };

  const Petal = ({ label, position }: { label?: string, position: 'top'|'left'|'right'|'bottom'|'topRight'|'center' }) => {
    if (!label) return null;
    const isSelected = selection === label;
    const visible = isActive || isHovered;
    const posStyles: React.CSSProperties = {
      position: 'absolute',
      width: '40px', height: '40px',
      borderRadius: '8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isSelected ? 'var(--accent-blue)' : 'var(--card-bg)',
      color: isSelected ? '#fff' : 'var(--text-primary)',
      fontWeight: 'bold', fontSize: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      opacity: visible ? 1 : 0, 
      transition: 'opacity 0.15s, background 0.1s',
      pointerEvents: 'none',
      border: `1px solid ${isSelected ? '#fff' : 'var(--card-border)'}`,
    };
    if (position === 'center') { posStyles.top = '50%'; posStyles.left = '50%'; posStyles.transform = 'translate(-50%, -50%)'; posStyles.fontSize = '1.2rem'; }
    if (position === 'top') { posStyles.top = '-50px'; posStyles.left = '50%'; posStyles.transform = 'translateX(-50%)'; }
    if (position === 'bottom') { posStyles.bottom = '-50px'; posStyles.left = '50%'; posStyles.transform = 'translateX(-50%)'; }
    if (position === 'left') { posStyles.left = '-50px'; posStyles.top = '50%'; posStyles.transform = 'translateY(-50%)'; }
    if (position === 'right') { posStyles.right = '-50px'; posStyles.top = '50%'; posStyles.transform = 'translateY(-50%)'; }
    if (position === 'topRight') { posStyles.right = '-40px'; posStyles.top = '-40px'; } // Diagonal placement

    return <div style={posStyles}>{label}</div>;
  };

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '60px' }}
      onPointerEnter={() => !disabled && setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <button
        ref={buttonRef}
        className={`virtual-btn ${isRot ? 'rot-btn' : ''}`}
        disabled={disabled}
        style={{ width: '100%', height: '100%', position: 'absolute', zIndex: (isActive || isHovered) ? 10 : 1, touchAction: 'none' }}
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
        <span style={{ opacity: (isActive || isHovered) ? 0.3 : 1, transition: 'opacity 0.1s' }}>{base}</span>
      </button>

      {/* Guide Petals */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
        <Petal label={topRight} position="topRight" />
        <Petal label={top} position="top" />
        <Petal label={left} position="left" />
        <Petal label={right} position="right" />
        <Petal label={bottom} position="bottom" />
        <Petal label={base} position="center" />
      </div>
    </div>
  );
}

interface VirtualPadProps {
  onInputMove: (move: Move) => void;
  disabled: boolean;
}

export function VirtualPad({ onInputMove, disabled }: VirtualPadProps) {
  const baseMoves = ['R', 'L', 'U', 'D', 'F', 'B'];
  const rotMoves = ['x', 'y', 'z'];

  return (
    <div className="virtual-pad" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
        Flick Input UI
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1rem 0' }}>
        {baseMoves.map(base => (
          <FlickButton 
            key={base} base={base} 
            left={`${base}'`} top={`${base}2`} right={`${base}w`} bottom={`${base}w'`} topRight={`${base}w2`}
            onSelect={onInputMove} disabled={disabled}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>持替</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', flex: 1 }}>
          {['x', 'y', 'z'].map(rot => (
            <button 
              key={rot} 
              className="virtual-btn rot-btn" 
              onClick={() => onInputMove(rot as Move)}
              disabled={disabled}
              style={{ height: '40px' }}
            >
              {rot}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
