import { useMemo } from "react";
import { GitHubClient } from "@terminal-mobile/shared";
import { useGitHubAuth } from "../context/AuthContext";

export function useGitHubClient(): GitHubClient | null {
  const { token } = useGitHubAuth();
  return useMemo(() => (token ? new GitHubClient(token) : null), [token]);
}
