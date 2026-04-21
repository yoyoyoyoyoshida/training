import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useProfile(user: User | null) {
  const [profileName, setProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfileName('ゲスト');
      setLoading(false);
      setIsNewUser(false);
      return;
    }

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfileName(docSnap.data().displayName);
        setIsNewUser(false);
      } else {
        // 初回ユーザー: モーダルを表示させるためにフラグを立てる
        // 自動保存はせず、ユーザーに入力を促す
        setProfileName(user.displayName || '');
        setIsNewUser(true);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfileData = async (uid: string, name: string) => {
     const docRef = doc(db, 'users', uid);
     await setDoc(docRef, { displayName: name }, { merge: true });
     setProfileName(name);
     setIsNewUser(false); // 保存されたら新規ユーザーではなくなる
  };

  return { profileName, setProfileName, updateProfileData, loading, isNewUser };
}
