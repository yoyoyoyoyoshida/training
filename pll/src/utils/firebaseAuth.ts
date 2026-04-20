import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { firebaseApp, isFirebaseConfigured } from './firebaseClient';

/**
 * Ensures we are authenticated the same way the mobile app signs in (anonymous auth).
 * Firestore ルールが `request.auth != null` を想定しているため、Web でも匿名ログインする。
 */
export const ensureAnonymousSignIn = () => {
  if (!isFirebaseConfigured || !firebaseApp) return;

  const auth = getAuth(firebaseApp);

  if (auth.currentUser) {
    return;
  }

  // 既に進行中の sign-in がある場合を避けるため、状態変化を一度だけ監視する
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch((error) => {
        console.error('Failed to sign in anonymously', error);
      });
    }
    unsubscribe();
  });
};
