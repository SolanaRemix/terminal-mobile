import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PullRequest } from "@terminal-mobile/shared";
import { useGitHubClient } from "../hooks/useGitHubClient";
import { PRCard } from "../components/PRCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import styles from "./PRListScreen.module.css";

export function PRListScreen() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const client = useGitHubClient();
  const navigate = useNavigate();
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !owner || !name) return;
    client
      .listPullRequests(owner, name)
      .then(setPRs)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load PRs"))
      .finally(() => setLoading(false));
  }, [client, owner, name]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/repos")}>← Repos</button>
        <span className={styles.title}>{owner}/{name}</span>
      </header>
      <main className={styles.main}>
        <h1 className={styles.heading}>Open Pull Requests</h1>
        {loading && <LoadingSkeleton count={4} height="80px" />}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && prs.length === 0 && !error && (
          <p className={styles.empty}>No open pull requests.</p>
        )}
        <div className={styles.list}>
          {prs.map((pr) => (
            <PRCard
              key={pr.number}
              pr={pr}
              onClick={() => navigate(`/repos/${owner}/${name}/prs/${pr.number}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
