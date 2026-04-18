import React from "react";
import { useNavigate } from "react-router-dom";
import { useGitHubAuth } from "../context/AuthContext";
import styles from "./SettingsScreen.module.css";

export function SettingsScreen() {
  const { login, avatarUrl, logout } = useGitHubAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/repos")}>← Repos</button>
        <span className={styles.title}>Settings</span>
      </header>
      <main className={styles.main}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>GitHub Account</h2>
          <div className={styles.profile}>
            {avatarUrl && (
              <img src={avatarUrl} alt={login ?? ""} className={styles.avatar} />
            )}
            <div>
              <div className={styles.login}>{login ?? "Not connected"}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={() => { logout(); navigate("/auth"); }}>
            Disconnect GitHub
          </button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Safety Preferences</h2>
          <p className={styles.note}>
            Dangerous commands (merge, tag) always require confirmation before execution.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <p className={styles.note}>CyberAi Terminal v1.0.0 — SmartBrain / CyberAi</p>
        </section>
      </main>
    </div>
  );
}
