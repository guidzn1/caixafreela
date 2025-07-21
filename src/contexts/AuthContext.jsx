import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { LoadingScreen } from '../components/LoadingScreen/LoadingScreen';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      return () => unsubscribe();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const logout = useCallback(() => {
    toast.promise(
      signOut(auth),
      {
        loading: 'A terminar a sessão...',
        success: 'Sessão terminada com sucesso!',
        error: 'Ocorreu um erro ao sair.',
      }
    );
  }, []);

  useEffect(() => {
    let logoutTimer;

    const resetTimer = () => {
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        if (auth.currentUser) {
          toast.error("Sessão expirada por inatividade.");
          logout();
        }
      }, 30 * 60 * 1000); // 30 minutos
    };

    if (user) {
      const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
      resetTimer();
      events.forEach(event => window.addEventListener(event, resetTimer));

      return () => {
        clearTimeout(logoutTimer);
        events.forEach(event => window.removeEventListener(event, resetTimer));
      };
    }
  }, [user, logout]);
  
  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: name,
      email: user.email,
      createdAt: new Date().toISOString()
    });
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const updateUserPassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (user) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      return updatePassword(user, newPassword);
    }
    throw new Error("Nenhum usuário logado.");
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        createdAt: new Date().toISOString()
      });
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    updateUserPassword,
    signInWithGoogle
  };
  
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};