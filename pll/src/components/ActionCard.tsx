import { Link } from 'react-router-dom';
import type { MouseEvent, ReactNode } from 'react';
import clsx from 'clsx';
import './ActionCard.css';

interface ActionCardProps {
  title: string;
  description: string;
  to: string;
  accent?: 'blue' | 'green' | 'pink' | 'purple' | 'orange';
  badge?: string;
  icon?: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  highlight?: boolean;
}

function ActionCard({ title, description, to, accent = 'blue', badge, icon, onClick, highlight = false }: ActionCardProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      event.preventDefault();
      onClick(event);
    }
  };

  return (
    <Link
      to={to}
      className={clsx('action-card', `accent-${accent}`, { 'is-highlight': highlight })}
      onClick={handleClick}
    >
      <div className="action-card__body">
        <div className="action-card__info">
          {icon ? <span className="action-card__icon" aria-hidden="true">{icon}</span> : null}
          <div className="action-card__text">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
        <span className="action-card__cta">→</span>
      </div>
      {badge ? <span className="action-card__badge">{badge}</span> : null}
    </Link>
  );
}

export default ActionCard;
