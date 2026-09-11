import { createContext } from "react";
import type { CurrentUser } from "../../api/types";

/**
 * Three states, none of them a combination of booleans. "Loading" exists
 * because on first render we have not yet asked the server whether the cookie
 * is valid — and rendering a login form for a signed-in user, even for a
 * moment, is a visible flicker.
 */
export type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "signedIn"; user: CurrentUser };

export type AuthContextValue = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

/**
 * null as the default on purpose. A component that reads this outside a
 * provider is a bug, and null makes useAuth notice it instead of silently
 * handing out a fake "anonymous" that hides the mistake.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);