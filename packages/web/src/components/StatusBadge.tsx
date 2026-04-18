import React from "react";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  state: "open" | "closed";
  merged?: boolean;
}

export function StatusBadge({ state, merged }: StatusBadgeProps) {
  const label = merged ? "merged" : state;
  const cls = merged ? styles.merged : state === "open" ? styles.open : styles.closed;
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}
