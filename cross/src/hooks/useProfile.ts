import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useProfile(user: User | null) {
  const [profileName, setProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfileName('ゲスト');
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfileName(docSnap.data().displayName);
      } else {
        // 初期値としてGoogleの名前をセット
        const initialName = user.displayName || '名無しのキューバー';
        setProfileName(initialName);
        await setDoc(docRef, { displayName: initialName }, { merge: true });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfileName = async (newName: string) => {
    if (!user) return;
    const docRef = doc(doc(db, 'users', user.uid));
    await setDoc(docRef, { displayName: newName }, { merge: true });
    setProfileName(newName);
  };

  const updateProfileData = async (uid: string, name: string) => {
     const docRef = doc(db, 'users', uid);
     await setDoc(docRef, { displayName: name }, { merge: true });
     setProfileName(name);
  };

  return { profileName, setProfileName, updateProfileData, loading };
}
