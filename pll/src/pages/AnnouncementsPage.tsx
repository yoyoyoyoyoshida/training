import { useEffect, useState } from 'react';
import { Timestamp, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '../utils/firebaseClient';
import type { Announcement } from '../types';
import { storage, STORAGE_KEYS } from '../utils/storage';
import AdSenseSlot from '../components/AdSenseSlot';
import './AnnouncementsPage.css';

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!firestore) return;
      setLoading(true);
      setError(null);
      try {
        const ref = collection(firestore, 'announcements');
        const snapshot = await getDocs(query(ref, orderBy('createdAt', 'desc')));
        const items: Announcement[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title ?? 'Untitled',
            content: data.content ?? '',
            createdAt: (data.createdAt as Timestamp | undefined)?.toDate() ?? new Date(),
          };
        });
        setAnnouncements(items);
        storage.setNumber(STORAGE_KEYS.lastReadAnnouncement, Date.now());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'お知らせの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (isFirebaseConfigured) {
      fetchAnnouncements();
    }
  }, []);

  return (
    <section className="announcements">
      <header className="announcements__header">
        <h1>お知らせ</h1>
        <p>アプリの最新情報やイベント告知を掲載します。モバイル版と同じFirestoreコレクションを利用します。</p>
      </header>

      {!isFirebaseConfigured ? (
        <div className="announcements__placeholder">
          <p>Firebaseの設定が有効になるとお知らせが表示されます。</p>
        </div>
      ) : loading ? (
        <p>読み込み中...</p>
      ) : error ? (
        <div className="announcements__error">{error}</div>
      ) : announcements.length === 0 ? (
        <p>現在表示できるお知らせはありません。</p>
      ) : (
        <div className="announcements__list">
          {announcements.map((item) => (
            <article key={item.id} className="announcements__card">
              <time>{item.createdAt.toLocaleString('ja-JP')}</time>
              <h2>{item.title}</h2>
              <p>{item.content}</p>
            </article>
          ))}
        </div>
      )}

      <AdSenseSlot />
    </section>
  );
}

export default AnnouncementsPage;
