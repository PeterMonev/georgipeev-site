import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentUser, login, logout } from "../../api/auth";
import { AuthContext, type AuthContextValue, type AuthState } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  // On first render, ask the server whether the cookie it may already hold is
  // still good. This is the only request the public site makes to /api/auth.
  useEffect(() => {
    const controller = new AbortController();

    getCurrentUser(controller.signal)
      .then((user) => setState({ status: "signedIn", user }))
      .catch(() => {
        if (controller.signal.aborted) return;
        // 401 and any other failure both mean the same thing to the UI:
        // nobody is signed in. Not worth distinguishing here.
        setState({ status: "anonymous" });
      });

    return () => controller.abort();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const user = await login(email, password);
    setState({ status: "signedIn", user });
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setState({ status: "anonymous" });
  }, []);

  // The context value is an object. Without useMemo it would be a fresh object
  // on every render, and every consumer would re-render even when nothing
  // inside it changed.
  const value = useMemo<AuthContextValue>(
    () => ({ state, signIn, signOut }),
    [state, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}