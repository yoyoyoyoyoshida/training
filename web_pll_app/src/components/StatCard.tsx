import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: 'blue' | 'green' | 'amber';
}

function StatCard({ label, value, hint, accent = 'blue' }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      {hint ? <span className="stat-card__hint">{hint}</span> : null}
    </div>
  );
}

export default StatCard;
