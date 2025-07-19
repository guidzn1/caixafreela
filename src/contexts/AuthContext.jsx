import { createContext, useState, useEffect, useContext } from 'react';
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

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  const logout = () => {
    toast.promise(
      signOut(auth),
      {
        loading: 'A terminar a sessão...',
        success: 'Sessão terminada com sucesso!',
        error: 'Ocorreu um erro ao sair.',
      }
    );
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
    return <div>Carregando aplicação...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};