import { useState } from 'react';
import ActionCard from '../components/ActionCard';
import AdSenseSlot from '../components/AdSenseSlot';
import QrCode from '../components/QrCode';
import profileIcon from '../../icon/1.png';
import practiceIcon from '../../icon/2.png';
import challengeIcon from '../../icon/3.png';
import samplePllIcon from '../../icon/sample_pll.png';
import './HomePage.css';

function TrophyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function HomePage() {
  const [showAppModal, setShowAppModal] = useState(false);
  return (
    <section className="home">
      <div className="home__motion-bg" aria-hidden="true">
        <span className="shape shape--one" />
        <span className="shape shape--two" />
        <span className="shape shape--three" />
      </div>
      <div className="home__hero">
        <h1 className="home__title">0.5秒でPLL判断しよう！</h1>
        
        <div className="home__hero-image">
          <img src={samplePllIcon} alt="PLL Challenge" draggable={false} />
        </div>

        <button 
          className="home__app-trigger"
          onClick={() => setShowAppModal(true)}
        >
          <span>iPhoneアプリはこちら</span>
          <span className="home__subtitle-arrow">→</span>
        </button>
      </div>

      <div className="home__actions">
        <ActionCard
          title="プロフィール"
          description="プレイヤー名や学習状況、ベストスコアをまとめて確認できます。"
          to="/profile"
          accent="orange"
          icon={<img src={profileIcon} alt="" draggable={false} />}
        />
        <ActionCard
          title="一人で練習"
          description="名前を覚える・確認テストなど段階的にPLLを身につけましょう。"
          to="/practice"
          accent="green"
          icon={<img src={practiceIcon} alt="" draggable={false} />}
        />
        <ActionCard
          title="実力を試す"
          description="60秒タイムアタックでスコアを競い、復習リストも自動で更新されます。"
          to="/practice/time-attack"
          accent="pink"
          highlight
          icon={<img src={challengeIcon} alt="" draggable={false} />}
        />
        <ActionCard
          title="ランキング"
          description="世界中のプレイヤーとスコアを競いましょう。JST基準で今日のトップも掲載中。"
          to="/ranking"
          accent="blue"
          icon={<TrophyIcon />}
        />
      </div>

      <AdSenseSlot />

      {/* App Store Modal */}
      {showAppModal && (
        <div className="home__modal-overlay" onClick={() => setShowAppModal(false)}>
          <div className="home__modal" onClick={e => e.stopPropagation()}>
            <button className="home__modal-close" onClick={() => setShowAppModal(false)}>×</button>
            <h3>iPhoneアプリを入手</h3>
            <p>App Storeで今すぐダウンロード</p>
            <div className="home__modal-content">
              <a
                className="home__store-link"
                href="https://apps.apple.com/jp/app/2sidepll/id6747999697"
                target="_blank"
                rel="noreferrer"
              >
                App Store
              </a>
              <div className="home__modal-qr">
                <QrCode url="https://apps.apple.com/jp/app/2sidepll/id6747999697" size={180} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HomePage;
