import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";

type AuthRole = "public" | "ambulance" | "hospital";

interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
  role: AuthRole;
  extra?: Record<string, string>;
}

export const useAuth = (role: AuthRole) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const isLoggedIn = !!user;

  const login = async (email?: string, password?: string) => {
    if (!email || !password) return;
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const msg = err?.code === "auth/invalid-credential"
        ? "Invalid email or password"
        : err?.code === "auth/user-not-found"
        ? "No account found with this email"
        : err?.code === "auth/too-many-requests"
        ? "Too many attempts. Try again later."
        : err?.message || "Login failed";
      setError(msg);
      throw err;
    }
  };

  const signup = async (data: SignUpData) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (data.displayName) {
        await updateProfile(cred.user, { displayName: data.displayName });
      }
      // Store user profile in RTDB
      await set(ref(db, `users/${cred.user.uid}`), {
        email: data.email,
        displayName: data.displayName || "",
        role: data.role,
        ...data.extra,
        createdAt: Date.now(),
      });
    } catch (err: any) {
      const msg = err?.code === "auth/email-already-in-use"
        ? "An account with this email already exists"
        : err?.code === "auth/weak-password"
        ? "Password should be at least 6 characters"
        : err?.message || "Sign up failed";
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, isLoggedIn, loading, error, login, signup, logout };
};
