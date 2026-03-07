import React from "react";
import type { PullRequest } from "@terminal-mobile/shared";
import { StatusBadge } from "./StatusBadge";
import { ChecksIndicator } from "./ChecksIndicator";
import styles from "./PRCard.module.css";

interface PRCardProps {
  pr: PullRequest;
  onClick?: () => void;
}

export function PRCard({ pr, onClick }: PRCardProps) {
  return (
    <div className={styles.card} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className={styles.header}>
        <span className={styles.number}>#{pr.number}</span>
        <StatusBadge state={pr.state} merged={pr.merged} />
      </div>
      <div className={styles.title}>{pr.title}</div>
      <div className={styles.meta}>
        <span className={styles.branch}>
          <code>{pr.headBranch}</code>
          {" → "}
          <code>{pr.baseBranch}</code>
        </span>
        <span className={styles.author}>by {pr.author.login}</span>
        {pr.checksStatus && <ChecksIndicator status={pr.checksStatus} />}
      </div>
    </div>
  );
}
