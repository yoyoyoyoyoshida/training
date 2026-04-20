import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Score {
  id: string;
  userName: string;
  moveCount: number;
  timeTaken: number;
}

export function RankingBoard() {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    // 複合インデックスエラーを避けるため、メインのソートのみFirestoreで行い、
    // タイムのタイブレークはクライアント側で処理します
    const q = query(
      collection(db, 'scores'),
      orderBy('moveCount', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let parsed: Score[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        parsed.push({
          id: doc.id,
          userName: data.userName,
          moveCount: data.moveCount,
          timeTaken: data.timeTaken
        });
      });
      
      // クライアント側でタイムによるタイブレークを行い、Top 10に絞る
      parsed.sort((a, b) => {
        if (a.moveCount !== b.moveCount) return a.moveCount - b.moveCount;
        return a.timeTaken - b.timeTaken;
      });
      parsed = parsed.slice(0, 10);
      
      setScores(parsed);
    }, (error) => {
      console.error("Ranking fetch error:", error);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (ms: number) => (ms / 1000).toFixed(2);

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '200px' }}>
      <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Top 10 Ranking</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', background: 'rgba(0,122,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
      </h3>
      
      {scores.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
          待機中... またはスコアがありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
          {scores.map((score, index) => (
            <div key={score.id} style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '30px', fontWeight: 800, color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-secondary)' }}>
                #{index + 1}
              </div>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '10px' }}>
                {score.userName}
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 800 }}>
                <span style={{ color: 'var(--accent-blue)', marginRight: '8px' }}>{score.moveCount}手</span>
                <span style={{ color: '#fff' }}>{formatTime(score.timeTaken)}s</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
