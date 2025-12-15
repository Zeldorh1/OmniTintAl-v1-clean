// src/context/AuthContext.tsx
// FINAL AUTH SYSTEM for OmniTintAI

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth } from "../firebase/firebaseConfig";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  PhoneAuthProvider,
  signInWithCredential,
  type User,
} from "firebase/auth";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  loginEmail: (email: string, password: string) => Promise<any>;
  registerEmail: (email: string, password: string) => Promise<any>;
  verifyPhone: (verificationId: string, code: string) => Promise<any>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const loginEmail = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const registerEmail = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  // Phone verification (uses Firebase SMS)
  const verifyPhone = async (verificationId: string, code: string) => {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    return await signInWithCredential(auth, credential);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        loginEmail,
        registerEmail,
        verifyPhone,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider />");
  }
  return ctx;
};
