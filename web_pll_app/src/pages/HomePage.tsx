import ActionCard from '../components/ActionCard';
import AdSenseSlot from '../components/AdSenseSlot';
import QrCode from '../components/QrCode';
import profileIcon from '../../icon/1.png';
import practiceIcon from '../../icon/2.png';
import challengeIcon from '../../icon/3.png';
import './HomePage.css';

function HomePage() {
  return (
    <section className="home">
      <div className="home__motion-bg" aria-hidden="true">
        <span className="shape shape--one" />
        <span className="shape shape--two" />
        <span className="shape shape--three" />
      </div>
      <div className="home__hero">
        <h1 className="home__title">PLLで世界一を！</h1>
        <div className="home__subtitle">
          <span>iPhoneをお持ちの方はこちら</span>
          <span aria-hidden="true" className="home__subtitle-arrow">
            ↓
          </span>
        </div>
        <div className="home__cta-cluster">
          <a
            className="home__store-link"
            href="https://apps.apple.com/jp/app/2sidepll/id6747999697"
            target="_blank"
            rel="noreferrer"
          >
            App Store
          </a>
          <div className="home__hero-qr">
            <QrCode url="https://apps.apple.com/jp/app/2sidepll/id6747999697" size={160} />
          </div>
        </div>
      </div>

      <div className="home__actions">
        <ActionCard
          title="プロフィール"
          description="プレイヤー名や学習状況、ベストスコアをまとめて確認できます。"
          to="/profile"
          accent="orange"
          icon={<img src={profileIcon} alt="" />}
        />
        <ActionCard
          title="一人で練習"
          description="名前を覚える・確認テストなど段階的にPLLを身につけましょう。"
          to="/practice"
          accent="green"
          icon={<img src={practiceIcon} alt="" />}
        />
        <ActionCard
          title="実力を試す"
          description="60秒タイムアタックでスコアを競い、復習リストも自動で更新されます。"
          to="/practice/time-attack"
          accent="pink"
          highlight
          icon={<img src={challengeIcon} alt="" />}
        />
        <ActionCard
          title="ランキング"
          description="世界中のプレイヤーとスコアを競いましょう。JST基準で今日のトップも掲載中。"
          to="/ranking"
          accent="blue"
          icon={<span role="img" aria-label="ranking">🏆</span>}
        />
      </div>

      <AdSenseSlot />
    </section>
  );
}

export default HomePage;
