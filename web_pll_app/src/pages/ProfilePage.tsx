import { FormEvent, useEffect, useState } from 'react';
import { profileManager } from '../utils/profileManager';
import { highScoreManager } from '../utils/highScoreManager';
import { storage, STORAGE_KEYS } from '../utils/storage';
import profileCoachIcon from '../../icon/1.png';
import './ProfilePage.css';
import BackHomeButton from '../components/BackHomeButton';

function ProfilePage() {
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const totalAttempts = storage.getNumber(STORAGE_KEYS.timeAttackCount, 0);

  useEffect(() => {
    const load = async () => {
      const currentName = profileManager.getName();
      setName(currentName);
      setInput(currentName);
    };
    load();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setMessage('名前を入力してください');
      return;
    }
    if (trimmed.length > 20) {
      setMessage('名前は20文字以内で入力してください');
      return;
    }
    profileManager.saveName(trimmed);
    setName(trimmed);
    setMessage('保存しました');
  };

  return (
    <section className="profile">
      <div className="profile__coach-wrapper">
        <div className="profile__coach">
          <img src={profileCoachIcon} alt="コーチ" />
          <div className="profile__coach-bubble">
            <p>名前の登録と、実績を確認しよう！</p>
          </div>
        </div>
      </div>
      <div className="profile__grid">
        <section className="profile__card">
          <h2>ランキングに載せる名前</h2>
          <form onSubmit={handleSubmit} className="profile__form">
            <input
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="プレイヤー名を入力"
              maxLength={20}
            />
            <button type="submit">保存する</button>
          </form>
          <p className="profile__current-name">現在: {name || '未設定'}</p>
          {message ? <p className="profile__message">{message}</p> : null}
        </section>

        <section className="profile__card">
          <h2>あなたの成績</h2>
          <ul>
            <li>本日の最高スコア: {highScoreManager.getDailyHighScore()} 問</li>
            <li>歴代最高スコア: {highScoreManager.getAllTimeHighScore()} 問</li>
            <li>タイムアタック挑戦回数: {totalAttempts} 回</li>
          </ul>
        </section>
      </div>
      <BackHomeButton />
    </section>
  );
}

export default ProfilePage;
