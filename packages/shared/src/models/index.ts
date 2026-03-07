// GitHub domain models for CyberAi Terminal

export interface GitHubUser {
  login: string;
  avatarUrl: string;
  id: number;
}

export interface Repository {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
}

export interface CheckStatus {
  state: "success" | "failure" | "pending" | "error";
  totalCount: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
}

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  merged: boolean;
  mergeable: boolean | null;
  headBranch: string;
  baseBranch: string;
  author: GitHubUser;
  createdAt: string;
  updatedAt: string;
  checksStatus: CheckStatus | null;
}

export interface PRComment {
  id: number;
  body: string;
  author: GitHubUser;
  createdAt: string;
  isTerminalCommand: boolean;
}

export type CommandName = "help" | "status" | "merge" | "tag" | "scan";

export interface TerminalCommand {
  name: CommandName;
  args: string[];
  rawInput: string;
}

export interface CommandResult {
  command: TerminalCommand;
  success: boolean;
  message: string;
  data?: unknown;
  timestamp: string;
}
