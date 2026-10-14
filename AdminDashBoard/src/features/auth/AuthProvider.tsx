import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/lib/api/services";
import {
  readSession,
  saveSession,
  errorMessage,
  type Session,
} from "@/lib/api/client";
import { ErrorState, LoadingSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Admin } from "@/types/api";
interface AuthContextValue {
  admin: Admin | null;
  session: Session | null;
  loading: boolean;
  error: unknown;
  retry: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loggingOut: boolean;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [session, setSession] = useState(readSession);
  const [loggingOut, setLoggingOut] = useState(false);
  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: !!session,
    retry: false,
    staleTime: 60000,
  });
  const clear = () => {
    saveSession(null);
    setSession(null);
    void client.cancelQueries();
    client.clear();
  };
  useEffect(() => {
    const onExpired = () => {
      saveSession(null);
      setSession(null);
      void client.cancelQueries();
      client.clear();
      toast.error("Your session expired. Please sign in again.");
    };
    window.addEventListener("aurel:unauthorized", onExpired);
    return () => window.removeEventListener("aurel:unauthorized", onExpired);
  }, [client]);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      () => window.dispatchEvent(new Event("aurel:unauthorized")),
      Math.min(
        Math.max(0, Date.parse(session.expiresAt) - Date.now()),
        2147483647,
      ),
    );
    return () => clearTimeout(timer);
  }, [session]);
  const login = async (username: string, password: string) => {
    const result = await authApi.login({ username, password });
    const next = { token: result.accessToken, expiresAt: result.expiresAt };
    saveSession(next);
    client.setQueryData(["auth", "me"], result.admin);
    setSession(next);
  };
  const logout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
      toast.success("Signed out securely.");
    } catch (error) {
      toast.error(
        `${errorMessage(error)} Local session cleared; server token revocation could not be verified.`,
      );
    } finally {
      clear();
      setLoggingOut(false);
    }
  };
  return (
    <AuthContext.Provider
      value={{
        session,
        admin: session ? (me.data ?? null) : null,
        loading: !!session && me.isPending,
        error: me.error,
        retry: () => void me.refetch(),
        login,
        logout,
        loggingOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required.");
  return value;
}
export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.session)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (auth.loading)
    return (
      <div className="p-8">
        <LoadingSkeleton />
      </div>
    );
  if (auth.error)
    return (
      <div className="auth-recovery">
        <ErrorState error={auth.error} retry={auth.retry} />
        <Button variant="outline" onClick={() => void auth.logout()}>
          Clear session and sign in
        </Button>
      </div>
    );
  return <Outlet />;
}
