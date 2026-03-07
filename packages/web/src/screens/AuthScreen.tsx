import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGitHubAuth } from "../context/AuthContext";
import styles from "./AuthScreen.module.css";

export function AuthScreen() {
  const { setToken, isAuthenticated } = useGitHubAuth();
  const navigate = useNavigate();
  const [token, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) navigate("/repos");
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await setToken(token.trim());
      navigate("/repos");
    } catch {
      setError("Invalid token or GitHub API error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>⬡ CyberAi Terminal</div>
        <h1 className={styles.heading}>Connect GitHub</h1>
        <p className={styles.desc}>
          Enter a GitHub Personal Access Token with{" "}
          <code>repo</code> and <code>read:user</code> scopes.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            className={styles.input}
            placeholder="ghp_..."
            value={token}
            onChange={(e) => setTokenInput(e.target.value)}
            autoComplete="off"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.button}
            disabled={loading || !token.trim()}
          >
            {loading ? "Connecting…" : "Connect"}
          </button>
        </form>
        <p className={styles.hint}>
          <a
            href="https://github.com/settings/tokens/new"
            target="_blank"
            rel="noreferrer"
          >
            Generate a new token →
          </a>
        </p>
      </div>
    </div>
  );
}
