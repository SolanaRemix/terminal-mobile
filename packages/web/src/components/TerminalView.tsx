import React from "react";
import type { CommandResult } from "@terminal-mobile/shared";
import styles from "./TerminalView.module.css";

interface TerminalViewProps {
  results: CommandResult[];
  lines?: string[];
}

export function TerminalView({ results, lines }: TerminalViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [results, lines]);

  return (
    <div className={styles.terminal} ref={containerRef}>
      {lines?.map((line, i) => (
        <div key={i} className={styles.line}>
          {line}
        </div>
      ))}
      {results.map((r, i) => (
        <div key={i} className={`${styles.entry} ${r.success ? styles.success : styles.error}`}>
          <span className={styles.prompt}>$ /terminal {r.command.name}</span>
          {r.command.args.length > 0 && (
            <span className={styles.args}> {r.command.args.join(" ")}</span>
          )}
          <div className={styles.output}>{r.message}</div>
          <div className={styles.timestamp}>{new Date(r.timestamp).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
}
