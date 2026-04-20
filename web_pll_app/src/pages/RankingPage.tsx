import { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { firestore, isFirebaseConfigured } from '../utils/firebaseClient';
import { highScoreManager } from '../utils/highScoreManager';
import AdSenseSlot from '../components/AdSenseSlot';
import BackHomeButton from '../components/BackHomeButton';
import './RankingPage.css';

type DifficultyFilter = null | 1 | 2 | 6;

interface RankingEntry {
  id: string;
  name: string;
  score: number;
  timestamp?: Date;
  difficulty?: number | null;
}

const difficultyFilters: { label: string; value: DifficultyFilter }[] = [
  { label: '全て', value: null },
  { label: '1色', value: 1 },
  { label: '2色', value: 2 },
  { label: '6色', value: 6 },
];

dayjs.extend(utc);
dayjs.extend(timezone);

const FETCH_LIMIT = 500;
const DISPLAY_LIMIT = 100;

const dedupeByHighestScore = (entries: RankingEntry[]) => {
  const map = new Map<string, RankingEntry>();

  entries.forEach((entry) => {
    const rawName = entry.name.trim();
    const key = rawName ? rawName.toLowerCase() : entry.id;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, entry);
      return;
    }

    const existingTime = existing.timestamp?.getTime() ?? 0;
    const currentTime = entry.timestamp?.getTime() ?? 0;

    if (
      entry.score > existing.score ||
      (entry.score === existing.score && currentTime > existingTime)
    ) {
      map.set(key, entry);
    }
  });

  return Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, DISPLAY_LIMIT);
};

function RankingPage() {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(null);
  const [allTimeEntries, setAllTimeEntries] = useState<RankingEntry[]>([]);
  const [todayEntries, setTodayEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      if (!firestore) return;
      setLoading(true);
      setError(null);
      try {
        const rankingsRef = collection(firestore, 'global_rankings');

        const difficultyCondition =
          difficulty === null ? undefined : where('difficulty', '==', difficulty);

        const baseQuery = query(
          rankingsRef,
          ...(difficultyCondition ? [difficultyCondition] : []),
          orderBy('score', 'desc'),
          limit(FETCH_LIMIT),
        );

        const snapshot = await getDocs(baseQuery);
        const entries: RankingEntry[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name ?? '匿名',
            score: data.score ?? 0,
            difficulty: data.difficulty ?? null,
            timestamp: (data.timestamp as Timestamp | undefined)?.toDate(),
          };
        });
        const uniqueEntries = dedupeByHighestScore(entries);
        setAllTimeEntries(uniqueEntries);

        const startOfTodayTokyo = dayjs().tz('Asia/Tokyo').startOf('day');
        const endOfTodayTokyo = startOfTodayTokyo.add(1, 'day');

        const todayQuery = query(
          rankingsRef,
          ...(difficultyCondition ? [difficultyCondition] : []),
          where('timestamp', '>=', startOfTodayTokyo.toDate()),
          where('timestamp', '<', endOfTodayTokyo.toDate()),
          orderBy('timestamp', 'desc'),
          limit(FETCH_LIMIT),
        );

        const todaySnapshot = await getDocs(todayQuery);
        const todayEntriesRaw: RankingEntry[] = todaySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name ?? '匿名',
            score: data.score ?? 0,
            difficulty: data.difficulty ?? null,
            timestamp: (data.timestamp as Timestamp | undefined)?.toDate(),
          };
        });
        setTodayEntries(dedupeByHighestScore(todayEntriesRaw));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ランキングの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (isFirebaseConfigured) {
      fetchRankings();
    }
  }, [difficulty]);

  const localBest = useMemo(
    () => ({
      daily: highScoreManager.getDailyHighScore(),
      allTime: highScoreManager.getAllTimeHighScore(),
    }),
    [],
  );

  return (
    <section className="ranking">
      <header className="ranking__header">
        <h1>ランキング</h1>
        <p>世界中のプレイヤーとスコアを競い合いましょう。Firebaseの同一コレクションを利用するため、モバイル版とランキングが共有されます。</p>
      </header>

      {!isFirebaseConfigured ? (
        <div className="ranking__placeholder">
          <h2>Firebaseの設定が必要です</h2>
          <p>
            `.env` に Firebase Web アプリの設定値を入力してください。
            必要なキー: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
          </p>
          <p>設定後に `npm install` と `npm run dev` を実行するとランキングが表示されます。</p>
          <div className="ranking__local">
            <h3>ローカルベスト</h3>
            <ul>
              <li>本日の最高スコア: {localBest.daily} 問</li>
              <li>歴代最高スコア: {localBest.allTime} 問</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          <div className="ranking__filters">
            {difficultyFilters.map((filter) => (
              <button
                key={String(filter.value)}
                type="button"
                className={filter.value === difficulty ? 'is-active' : ''}
                onClick={() => setDifficulty(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {error ? <div className="ranking__error">{error}</div> : null}

          <div className="ranking__boards">
            <section>
              <h2>全期間トップ</h2>
              {loading ? (
                <p>読み込み中...</p>
              ) : (
                <ol>
                  {allTimeEntries.map((entry, index) => (
                    <li key={entry.id}>
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{entry.name}</span>
                      <span className="score">{entry.score} 問</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section>
              <h2>今日のトップ</h2>
              {loading ? (
                <p>読み込み中...</p>
              ) : todayEntries.length === 0 ? (
                <p>本日の記録はまだありません。</p>
              ) : (
                <ol>
                  {todayEntries.map((entry, index) => (
                    <li key={`${entry.id}-today`}>
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{entry.name}</span>
                      <span className="score">{entry.score} 問</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <AdSenseSlot />
          <BackHomeButton />
        </>
      )}
    </section>
  );
}

export default RankingPage;
