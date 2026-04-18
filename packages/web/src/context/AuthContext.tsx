import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { GitHubClient } from "@terminal-mobile/shared";

interface AuthState {
  token: string | null;
  login: string | null;
  avatarUrl: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "github_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    return { token, login: null, avatarUrl: null };
  });

  const setToken = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    try {
      const client = new GitHubClient(token);
      const user = await client.getUser();
      setState({ token, login: user.login, avatarUrl: user.avatarUrl });
    } catch {
      setState({ token, login: null, avatarUrl: null });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ token: null, login: null, avatarUrl: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.token,
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useGitHubAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useGitHubAuth must be used inside AuthProvider");
  return ctx;
}
