import { useState } from 'react';
import { createPortal } from 'react-dom';
import ActionCard from '../components/ActionCard';
import AdSenseSlot from '../components/AdSenseSlot';
import QrCode from '../components/QrCode';
import profileIcon from '../../icon/1.png';
import practiceIcon from '../../icon/2.png';
import challengeIcon from '../../icon/3.png';
import rankingIcon from '../../icon/4.png';
import samplePllIcon from '../../icon/sample_pll.png';
import './HomePage.css';

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
          icon={<img src={rankingIcon} alt="" draggable={false} />}
        />
      </div>

      <div className="home__app-promo">
        <button 
          className="home__app-pill"
          onClick={() => setShowAppModal(true)}
        >
          <span>iPhoneアプリはこちら</span>
          <span className="home__app-pill-arrow">→</span>
        </button>
      </div>

      <div className="home__spacer" style={{ height: '2rem' }} />

      <AdSenseSlot />

      {/* App Store Window Modal */}
      {showAppModal && createPortal(
        <div className="home__modal-overlay" onClick={() => setShowAppModal(false)}>
          <div className="home__window" onClick={e => e.stopPropagation()}>
            <div className="home__window-titlebar">
              <div className="home__window-controls">
                <span className="dot dot--close" onClick={() => setShowAppModal(false)} />
                <span className="dot dot--min" />
                <span className="dot dot--max" />
              </div>
              <span className="home__window-title">App Store</span>
            </div>
            <div className="home__window-body">
              <div className="home__modal-header">
                <div className="home__modal-icon"></div>
                <h3>iPhoneアプリを入手</h3>
                <p>2side PLL Recognition</p>
              </div>
              <div className="home__modal-content">
                <div className="home__modal-qr-section">
                  <QrCode url="https://apps.apple.com/jp/app/2sidepll/id6747999697" size={200} />
                  <span>カメラでスキャン</span>
                </div>
                <a
                  className="home__store-link"
                  href="https://apps.apple.com/jp/app/2sidepll/id6747999697"
                  target="_blank"
                  rel="noreferrer"
                >
                  App Store
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

export default HomePage;
