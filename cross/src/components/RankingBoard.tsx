import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, Timestamp, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Score {
  id: string;
  userName: string;
  moveCount: number;
  timeTaken: number;
  moveLog?: string[];
  scramble?: string[];
}

interface UserStat {
  userId: string;
  userName: string;
  count: number;
}

interface RankingBoardProps {
  batchId: string;
  onWatchReplay?: (moves: string[], name: string, scramble: string[]) => void;
}

export function RankingBoard({ batchId, onWatchReplay }: RankingBoardProps) {
  const [dailyTop, setDailyTop] = useState<Score | null>(null);
  const [monthlyTop, setMonthlyTop] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 今日の1位を取得 (Real-time)
    const qDaily = query(
      collection(db, 'scores'),
      where('batchId', '==', batchId)
    );

    const unsubscribeDaily = onSnapshot(qDaily, (snapshot) => {
      let parsed: Score[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        parsed.push({ id: doc.id, ...data } as Score);
      });
      parsed.sort((a, b) => {
        if (a.moveCount !== b.moveCount) return a.moveCount - b.moveCount;
        return (a.timeTaken || 0) - (b.timeTaken || 0);
      });
      setDailyTop(parsed[0] || null);
      setLoading(false);
    });

    // 2. 今月の練習量 Top 3 を取得 (One-time)
    const fetchMonthly = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const qMonthly = query(
        collection(db, 'scores'),
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(qMonthly);
      const userMap = new Map<string, { name: string, count: number }>();
      snap.forEach(doc => {
        const d = doc.data();
        if (d.batchId && String(d.batchId).startsWith('FREE_PRACTICE_')) {
          const current = userMap.get(d.userId) || { name: d.userName, count: 0 };
          userMap.set(d.userId, { name: d.userName, count: current.count + 1 });
        }
      });
      const stats = Array.from(userMap.entries()).map(([uid, data]) => ({
        userId: uid,
        userName: data.name,
        count: data.count
      }));
      stats.sort((a, b) => b.count - a.count);
      setMonthlyTop(stats.slice(0, 3));
    };
    
    fetchMonthly();

    return () => unsubscribeDaily();
  }, [batchId]);

  const formatTime = (ms: number) => (ms / 1000).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
      {/* Daily Top Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '1.2rem' }}>
        <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
            <span>本日の1発勝負 第1位</span>
          </div>
          <span style={{ fontSize: '0.6rem', color: 'var(--accent-green)', background: 'rgba(50,205,50,0.1)', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
        </h3>
        {dailyTop ? (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'rgba(50,205,50,0.05)', borderRadius: '8px', border: '1px solid rgba(50,205,50,0.1)', gap: '10px' }}>
            <div style={{ flex: 1, fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{dailyTop.userName}</div>
            <div style={{ textAlign: 'right', fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 800 }}>
              <span style={{ color: 'var(--accent-green)', marginRight: '8px' }}>{dailyTop.moveCount}手</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{formatTime(dailyTop.timeTaken)}s</span>
            </div>
            {dailyTop.moveLog && dailyTop.scramble && onWatchReplay && (
              <button 
                onClick={() => onWatchReplay(dailyTop.moveLog!, dailyTop.userName, dailyTop.scramble!)}
                style={{ background: 'var(--accent-green)', color: '#000', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '0.6rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ▶
              </button>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>{loading ? '読み込み中...' : '記録なし'}</div>
        )}
      </div>

      {/* Monthly Stats Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '1.2rem' }}>
        <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF8800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.203 1.15-3.003C7.5 14 8.5 14.5 8.5 14.5Z" />
          </svg>
          <span>今月のガチ練習者 Top 3</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {monthlyTop.length > 0 ? (
            monthlyTop.map((s, i) => (
              <div key={s.userId} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.85rem' }}>
                <div style={{ width: '24px', fontWeight: 800, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32' }}>#{i+1}</div>
                <div style={{ flex: 1, fontWeight: 600 }}>{s.userName}</div>
                <div style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '0.8rem' }}>{s.count}回</div>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>記録なし</div>
          )}
        </div>
      </div>
    </div>
  );
}
