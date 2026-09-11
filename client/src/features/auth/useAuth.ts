import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./authContext";

/**
 * The only way components read auth. Throwing here turns "forgot the
 * provider" from a silent wrong answer into a loud error at the exact place
 * it happened.
 */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (value === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return value;
}