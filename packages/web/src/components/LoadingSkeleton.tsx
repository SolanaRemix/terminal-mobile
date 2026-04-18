import React from "react";
import styles from "./LoadingSkeleton.module.css";

interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  count?: number;
}

export function LoadingSkeleton({ width = "100%", height = "1rem", count = 1 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeleton} style={{ width, height }} />
      ))}
    </>
  );
}
