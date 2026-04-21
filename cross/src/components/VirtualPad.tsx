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
    // アクティブな判定が必要な状態（フリック中またはホバー中）かチェック
    if (!isActive && !isHovered) return;

    let dx, dy;
    if (isActive) {
      dx = x - startPos.current.x;
      dy = y - startPos.current.y;
    } else {
      // ホバー中の場合はボタンの中心からの相対距離を計算
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      dx = x - (rect.left + rect.width / 2);
      dy = y - (rect.top + rect.height / 2);
    }
    
    const distance = Math.hypot(dx, dy);

    let current = base;
    if (distance > 25) {
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

  const handlePointerLeave = () => {
    setIsHovered(false);
    setSelection(base); // 離れたら選択をセンターに戻す
  };

  const Petal = ({ label, angle }: { label?: string, angle: number | 'center' }) => {
    if (!label) return null;
    const isSelected = selection === label;
    const visible = isActive || isHovered;

    const radius = 68; 
    const isCenter = angle === 'center';
    
    const cos = isCenter ? 0 : Math.cos(((angle as number) * Math.PI) / 180);
    const sin = isCenter ? 0 : Math.sin(((angle as number) * Math.PI) / 180);

    const posStyles: React.CSSProperties = {
      position: 'absolute',
      width: isCenter ? '58px' : '46px',
      height: isCenter ? '58px' : '46px',
      borderRadius: '50%', // 完全な円形
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isSelected ? 'var(--accent-blue)' : (isCenter ? '#1a1a1a' : '#fff'),
      color: isSelected ? '#fff' : (isCenter ? '#fff' : '#000'),
      fontWeight: 800, 
      fontSize: isCenter ? '1.2rem' : '0.9rem',
      boxShadow: isSelected ? '0 0 25px var(--accent-blue)' : '0 4px 15px rgba(0,0,0,0.4)',
      opacity: visible ? 1 : 0, 
      transform: isCenter 
        ? 'translate(-50%, -50%)' 
        : `translate(calc(-50% + ${cos * radius}px), calc(-50% + ${sin * radius}px)) scale(${isSelected ? 1.1 : 1})`,
      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
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
      style={{ position: 'relative', width: '100%', height: '60px' }}
      onPointerEnter={() => !disabled && setIsHovered(true)}
      onPointerMove={(e) => !isActive && isHovered && moveInteraction(e.clientX, e.clientY)}
      onPointerLeave={handlePointerLeave}
    >
      <button
        ref={buttonRef}
        className={`virtual-btn ${isRot ? 'rot-btn' : ''}`}
        disabled={disabled}
        style={{ 
          width: '100%', height: '100%', position: 'absolute', zIndex: (isActive || isHovered) ? 10 : 1, touchAction: 'none',
          borderRadius: '500px', // 外側のボタン枠も丸く
          background: isHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
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
          fontSize: '1.2rem',
          fontWeight: 800
        }}>{base}</span>
      </button>

      {/* Guide Petals: 画像に基づいた5角形サークル配置 */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
        {/* 真上から時計回りに72度ずつ配分 */}
        <Petal label={top} angle={-90} />    {/* 2  (真上) */}
        <Petal label={topRight} angle={-18} /> {/* w2 (右上) */}
        <Petal label={right} angle={54} />    {/* w  (右下) */}
        <Petal label={bottom} angle={126} />    {/* w' (左下) */}
        <Petal label={left} angle={198} />      {/* '  (左上) */}
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
