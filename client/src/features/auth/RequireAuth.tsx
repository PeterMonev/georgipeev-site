import { Navigate, Outlet } from "react-router";
import { useAuth } from "./useAuth";

/**
 * A layout route: it renders no UI of its own, only decides whether the
 * routes nested inside it may render at all.
 */
export function RequireAuth() {
  const { state } = useAuth();

  switch (state.status) {
    case "loading":
      // Rendering nothing is right here. Showing the login form for a moment
      // and then swapping it out is worse than a brief blank.
      return null;

    case "anonymous":
      return <Navigate to="/admin/login" replace />;

    case "signedIn":
      // Outlet is the slot where the matched child route appears.
      return <Outlet />;
  }
}