import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getDailyScramble } from '../utils/scrambleGenerator';

interface GlobalRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchReplay?: (moves: string[], name: string, scramble: string[]) => void;
}

interface ScoreEntry {
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

export function GlobalRankingModal({ isOpen, onClose, onWatchReplay }: GlobalRankingModalProps) {
  const [tab, setTab] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [dailyScores, setDailyScores] = useState<ScoreEntry[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (tab === 'DAILY') fetchDailyScores();
      else fetchMonthlyStats();
    }
  }, [isOpen, tab]);

  const fetchDailyScores = async () => {
    setLoading(true);
    try {
      const daily = getDailyScramble();
      // インデックス不要なシンプルなクエリ
      const q = query(
        collection(db, 'scores'),
        where('batchId', '==', daily.batchId),
        limit(100) // 多めに取得してメモリでソート
      );
      
      const snap = await getDocs(q);
      const results: ScoreEntry[] = [];
      
      snap.forEach(doc => {
        const d = doc.data();
        if (d.moveCount !== undefined && d.timeTaken !== undefined) {
          results.push({ 
            id: doc.id, 
            userName: d.userName || 'Unknown',
            moveCount: d.moveCount,
            timeTaken: d.timeTaken,
            moveLog: d.moveLog,
            scramble: d.scramble
          });
        }
      });

      // 手数(ASC) -> タイム(ASC) でソート
      results.sort((a, b) => {
        if (a.moveCount !== b.moveCount) return a.moveCount - b.moveCount;
        return a.timeTaken - b.timeTaken;
      });

      setDailyScores(results.slice(0, 10));
    } catch (e) {
      console.error("Daily ranking fetch error:", e);
      setError("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // 作成日時のみで絞り込み（インデックス依存を最小化）
      const q = query(
        collection(db, 'scores'),
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
        limit(500)
      );
      
      const snap = await getDocs(q);
      const userMap = new Map<string, { name: string, count: number }>();
      
      snap.forEach(doc => {
        const d = doc.data();
        if (d.batchId && String(d.batchId).startsWith('FREE_PRACTICE_')) {
          const uid = d.userId;
          if (uid) {
            const current = userMap.get(uid) || { name: d.userName || 'Guest', count: 0 };
            userMap.set(uid, { name: current.name, count: current.count + 1 });
          }
        }
      });

      const stats: UserStat[] = Array.from(userMap.entries()).map(([uid, data]) => ({
        userId: uid,
        userName: data.name,
        count: data.count
      }));

      stats.sort((a, b) => b.count - a.count);
      setMonthlyStats(stats.slice(0, 10));
    } catch (e) {
      console.error("Monthly stats fetch error:", e);
      setError("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#111', width: '100%', maxWidth: '500px', borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', color: '#fff',
        position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.5rem' }}
        >
          ×
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34"></path>
            <path d="M12 22v-4"></path>
            <path d="M17 4H7a2 2 0 0 0-2 2v3a7 7 0 0 0 14 0V6a2 2 0 0 0-2-2Z"></path>
          </svg>
          全国上位者
        </h2>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
          <button 
            onClick={() => setTab('DAILY')}
            style={{
              flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none',
              background: tab === 'DAILY' ? 'var(--accent-green)' : 'transparent',
              color: tab === 'DAILY' ? '#000' : '#fff', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
              fontSize: '0.75rem'
            }}
          >
            本日の手数上位
          </button>
          <button 
            onClick={() => setTab('MONTHLY')}
            style={{
              flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none',
              background: tab === 'MONTHLY' ? 'var(--accent-green)' : 'transparent',
              color: tab === 'MONTHLY' ? '#000' : '#fff', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
              fontSize: '0.75rem'
            }}
          >
            今月のガチ練習者
          </button>
        </div>

        <div style={{ minHeight: '300px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>読み込み中...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#ff4444' }}>{error}</div>
          ) : tab === 'DAILY' ? (
            dailyScores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                まだ本日の記録がありません<br />
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>1発勝負を解いてランキングに載ろう！</span>
              </div>
            ) : (
              dailyScores.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', gap: '10px' }}>
                  <div style={{ width: '30px', fontWeight: 800, color: i < 3 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>#{i+1}</div>
                  <div style={{ flex: 1, fontWeight: 700 }}>{s.userName}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    <div style={{ color: 'var(--accent-green)', fontWeight: 800 }}>{s.moveCount}手</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{(s.timeTaken/1000).toFixed(2)}s</div>
                  </div>
                  {s.moveLog && s.scramble && onWatchReplay && (
                    <button 
                      onClick={() => onWatchReplay!(s.moveLog!, s.userName, s.scramble!)}
                      style={{ background: 'var(--accent-green)', color: '#000', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.6rem', cursor: 'pointer', fontWeight: 800 }}
                    >
                      再生
                    </button>
                  )}
                </div>
              ))
            )
          ) : (
            monthlyStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>まだ記録がありません</div>
            ) : (
              monthlyStats.map((s, i) => (
                <div key={s.userId} style={{ display: 'flex', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '30px', fontWeight: 800, color: i < 3 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>#{i+1}</div>
                  <div style={{ flex: 1, fontWeight: 700 }}>{s.userName}</div>
                  <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {s.count} <span style={{ fontSize: '0.7rem' }}>回答</span>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
