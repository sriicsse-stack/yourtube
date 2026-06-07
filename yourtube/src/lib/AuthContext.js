import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, provider } from "./firebase";
import axiosInstance from "./axiosinstance";

const defaultContext = {
  user: null,
  login: () => {},
  logout: async () => {},
  handlegooglesignin: async () => {},
  authLoading: false,
  authError: null,
};

const UserContext = createContext(defaultContext);

// Module-level flag to synchronously prevent multiple popup creations
let popupInProgress = false;

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);

  const login = useCallback((userdata, token) => {
    setUser(userdata);
    setAuthError(null);
    localStorage.setItem("user", JSON.stringify(userdata));
    if (token) {
      localStorage.setItem("token", token);
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Sign out error:", error);
      }
    }
  }, []);

  const syncWithBackend = useCallback(
    async (firebaseUser) => {
      const payload = {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        image: firebaseUser.photoURL || "https://github.com/shadcn.png",
        googleId: firebaseUser.uid,
      };
      const response = await axiosInstance.post("/user/login", payload);
      login(response.data.result, response.data.token);
      return response.data;
    },
    [login]
  );

  const handlegooglesignin = async () => {
    if (!auth || !provider) {
      setAuthError("Authentication is only available in the browser.");
      return;
    }

    // Prevent multiple concurrent popup attempts (synchronous guard)
    if (popupInProgress) {
      console.warn("Popup already in progress, ignoring duplicate request");
      return;
    }
    popupInProgress = true;
    setAuthError(null);
    setGoogleSigningIn(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result?.user || auth.currentUser;
      if (firebaseUser) {
        try {
          await syncWithBackend(firebaseUser);
        } catch (err) {
          console.error("Backend sync failed after popup sign-in:", err);
          setAuthError("Could not sync account with server. Please try again.");
        }
      }
    } catch (error) {
      const code = error?.code || "";

      // Common user-facing messages
      if (code === "auth/cancelled-popup-request") {
        // This occurs when multiple popups are triggered; inform user to retry
        console.warn("Cancelled popup request - likely another popup was open.");
        setAuthError("Previous sign-in was cancelled. Please try again.");
      } else if (code === "auth/popup-closed-by-user") {
        setAuthError("Sign in was cancelled. Please try again.");
      } else if (code === "auth/popup-blocked" || code === "auth/web-storage-unsupported") {
        // Try redirect fallback
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
          console.error("Redirect sign-in failed:", redirectErr);
          setAuthError(redirectErr?.message || "Sign in failed");
        }
      } else if (code === "auth/network-request-failed") {
        setAuthError("Network error during sign in. Check your connection and try again.");
      } else {
        console.error("Google sign-in error:", error);
        setAuthError(error?.message || "Sign in failed");
      }
    } finally {
      setGoogleSigningIn(false);
      popupInProgress = false;
    }
  };

  // Process redirect results (if any) when app loads in browser
  useEffect(() => {
    let mounted = true;
    async function handleRedirectResult() {
      if (!auth) return;
      try {
        const result = await getRedirectResult(auth);
        const firebaseUser = result?.user || auth.currentUser;
        if (firebaseUser && mounted) {
          try {
            await syncWithBackend(firebaseUser);
          } catch (err) {
            console.error("Backend sync failed after redirect sign-in:", err);
            setAuthError("Could not sync account with server. Please try again.");
          }
        }
      } catch (err) {
        // ignore no-redirect-result errors
        if (err?.code && err.code !== "auth/no-auth-event") {
          console.error("Error processing redirect result:", err);
        }
      }
    }

    handleRedirectResult();
    return () => {
      mounted = false;
    };
  }, [syncWithBackend]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        if (token) {
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
        }
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await syncWithBackend(firebaseUser);
        } catch (error) {
          console.error("Backend sync failed:", error);
          setAuthError("Could not sync account with server. Please try again.");
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [syncWithBackend]);

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        handlegooglesignin,
        authLoading,
        authError,
        googleSigningIn,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
