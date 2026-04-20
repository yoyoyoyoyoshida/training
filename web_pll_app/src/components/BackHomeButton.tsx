import { Link } from 'react-router-dom';
import './BackHomeButton.css';

function BackHomeButton() {
  return (
    <div className="back-home">
      <Link to="/" className="back-home__link">
        ← PLLホームに戻る
      </Link>
    </div>
  );
}

export default BackHomeButton;
