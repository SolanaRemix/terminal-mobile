import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Repository } from "@terminal-mobile/shared";
import { useGitHubClient } from "../hooks/useGitHubClient";
import { useGitHubAuth } from "../context/AuthContext";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import styles from "./RepoListScreen.module.css";

export function RepoListScreen() {
  const client = useGitHubClient();
  const { logout } = useGitHubAuth();
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) { navigate("/auth"); return; }
    client
      .listRepos()
      .then(setRepos)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load repos"))
      .finally(() => setLoading(false));
  }, [client, navigate]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>⬡ CyberAi Terminal</span>
        <button className={styles.logoutBtn} onClick={logout}>Logout</button>
      </header>
      <main className={styles.main}>
        <h1 className={styles.heading}>Repositories</h1>
        {loading && <LoadingSkeleton count={6} height="60px" />}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && repos.length === 0 && !error && (
          <p className={styles.empty}>No repositories found.</p>
        )}
        <ul className={styles.list}>
          {repos.map((r) => (
            <li key={r.fullName}>
              <button
                className={styles.repoItem}
                onClick={() => navigate(`/repos/${r.owner}/${r.name}/prs`)}
              >
                <span className={styles.repoName}>{r.fullName}</span>
                <span className={styles.branch}>{r.defaultBranch}</span>
                {r.private && <span className={styles.private}>private</span>}
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
