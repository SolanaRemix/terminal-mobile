import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PullRequest, PRComment, TerminalCommand } from "@terminal-mobile/shared";
import { getCommandRiskLevel } from "@terminal-mobile/shared";
import { useGitHubClient } from "../hooks/useGitHubClient";
import { usePolling } from "../hooks/usePolling";
import { useCommands } from "../hooks/useCommands";
import { TerminalView } from "../components/TerminalView";
import { CommandInput } from "../components/CommandInput";
import { StatusBadge } from "../components/StatusBadge";
import { ChecksIndicator } from "../components/ChecksIndicator";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import styles from "./PRDetailScreen.module.css";

export function PRDetailScreen() {
  const { owner, name, number } = useParams<{
    owner: string;
    name: string;
    number: string;
  }>();
  const client = useGitHubClient();
  const navigate = useNavigate();
  const prNumber = Number(number);

  const [pr, setPR] = useState<PullRequest | null>(null);
  const [comments, setComments] = useState<PRComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingExecute, setPendingExecute] = useState<null | (() => Promise<void>)>(null);

  const { history, pendingCommand, confirmCommand, cancelCommand, addResult } = useCommands();

  const fetchPR = useCallback(async () => {
    if (!client || !owner || !name || !prNumber) return;
    try {
      const [prData, commentData] = await Promise.all([
        client.getPullRequest(owner, name, prNumber),
        client.getPRComments(owner, name, prNumber),
      ]);
      setPR(prData);
      setComments(commentData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PR");
    } finally {
      setLoading(false);
    }
  }, [client, owner, name, prNumber]);

  useEffect(() => { fetchPR(); }, [fetchPR]);
  usePolling(fetchPR, 15000, !loading);

  const handleCommand = useCallback(
    (cmd: TerminalCommand) => {
      if (!client || !owner || !name) return;
      const execute = async () => {
        if (cmd.name === "merge") {
          await client.mergePR(owner, name, prNumber);
        } else if (cmd.name === "tag") {
          const tagName = cmd.args[0];
          if (!tagName) throw new Error("Tag name required: /terminal tag <name>");
          const sha = await client.getLatestCommit(owner, name, pr?.baseBranch || "main");
          await client.createTag(owner, name, tagName, sha);
        } else if (cmd.name === "status") {
          await fetchPR();
        }
        // help and scan are UI-only
      };

      const risk = getCommandRiskLevel(cmd.name);
      if (risk === "dangerous" || risk === "moderate") {
        setPendingExecute(() => execute);
        confirmCommand(cmd, execute);
      } else {
        confirmCommand(cmd, execute);
      }
    },
    [client, owner, name, prNumber, pr, confirmCommand, fetchPR]
  );

  const handleConfirm = async () => {
    if (!pendingCommand || !pendingExecute) return;
    try {
      await pendingExecute();
      addResult({
        command: pendingCommand,
        success: true,
        message: "Command executed successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      addResult({
        command: pendingCommand,
        success: false,
        message: e instanceof Error ? e.message : "Command failed.",
        timestamp: new Date().toISOString(),
      });
    }
    setPendingExecute(null);
  };

  const handleCancel = () => {
    cancelCommand();
    setPendingExecute(null);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <LoadingSkeleton count={5} height="24px" />
        </div>
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <p className={styles.error}>{error ?? "PR not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(`/repos/${owner}/${name}/prs`)}>
          ← PRs
        </button>
        <span className={styles.prNum}>#{pr.number}</span>
        <StatusBadge state={pr.state} merged={pr.merged} />
        {pr.checksStatus && <ChecksIndicator status={pr.checksStatus} />}
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{pr.title}</h1>
        <div className={styles.meta}>
          <code className={styles.branch}>{pr.headBranch}</code>
          <span className={styles.arrow}>→</span>
          <code className={styles.branch}>{pr.baseBranch}</code>
          <span className={styles.author}>by {pr.author.login}</span>
        </div>

        {pr.body && (
          <div className={styles.body}>{pr.body}</div>
        )}

        <div className={styles.commentSection}>
          <h2 className={styles.sectionTitle}>Comments</h2>
          <div className={styles.comments}>
            {comments.map((c) => (
              <div
                key={c.id}
                className={`${styles.comment} ${c.isTerminalCommand ? styles.terminalComment : ""}`}
              >
                <div className={styles.commentHeader}>
                  <strong>{c.author.login}</strong>
                  <span className={styles.commentTime}>
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                  {c.isTerminalCommand && (
                    <span className={styles.terminalBadge}>terminal</span>
                  )}
                </div>
                <div className={styles.commentBody}>{c.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.terminalSection}>
          <h2 className={styles.sectionTitle}>Terminal</h2>
          <TerminalView results={history} />
          <div className={styles.inputWrapper}>
            <CommandInput
              onSubmit={handleCommand}
              disabled={pr.state !== "open" && !pr.merged}
            />
          </div>
        </div>
      </main>

      {pendingCommand && pendingExecute && (
        <ConfirmDialog
          title={`Confirm: /terminal ${pendingCommand.name}`}
          message={
            pendingCommand.name === "merge"
              ? `Are you sure? This will squash-merge PR #${pr.number} into ${pr.baseBranch}.`
              : pendingCommand.name === "tag"
              ? `This will create tag \`${pendingCommand.args[0]}\` on ${pr.baseBranch}.`
              : `Run /terminal ${pendingCommand.name}?`
          }
          confirmLabel="Yes, proceed"
          danger={getCommandRiskLevel(pendingCommand.name) === "dangerous"}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
