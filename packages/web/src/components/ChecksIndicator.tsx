import React from "react";
import type { CheckStatus } from "@terminal-mobile/shared";
import styles from "./ChecksIndicator.module.css";

interface ChecksIndicatorProps {
  status: CheckStatus;
}

export function ChecksIndicator({ status }: ChecksIndicatorProps) {
  const cls =
    status.state === "success"
      ? styles.success
      : status.state === "failure"
      ? styles.failure
      : styles.pending;

  const icon =
    status.state === "success" ? "✓" : status.state === "failure" ? "✗" : "●";

  return (
    <span className={`${styles.indicator} ${cls}`} title={`Checks: ${status.successCount}/${status.totalCount} passing`}>
      {icon} {status.successCount}/{status.totalCount}
    </span>
  );
}
