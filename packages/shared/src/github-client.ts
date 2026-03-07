import { Octokit } from "@octokit/core";
import type {
  GitHubUser,
  Repository,
  PullRequest,
  PRComment,
  CheckStatus,
} from "./models";

export class GitHubClient {
  private octokit: Octokit;

  constructor(authToken: string) {
    this.octokit = new Octokit({ auth: authToken });
  }

  async getUser(): Promise<GitHubUser> {
    const res = await this.octokit.request("GET /user");
    return {
      login: res.data.login,
      avatarUrl: res.data.avatar_url,
      id: res.data.id,
    };
  }

  async listRepos(): Promise<Repository[]> {
    const res = await this.octokit.request("GET /user/repos", {
      sort: "updated",
      per_page: 100,
    });
    return res.data.map((r: Record<string, unknown>) => ({
      owner: (r.owner as { login: string }).login,
      name: r.name as string,
      fullName: r.full_name as string,
      defaultBranch: r.default_branch as string,
      private: r.private as boolean,
    }));
  }

  async listPullRequests(owner: string, repo: string): Promise<PullRequest[]> {
    const res = await this.octokit.request(
      "GET /repos/{owner}/{repo}/pulls",
      { owner, repo, state: "open", per_page: 50 }
    );
    return res.data.map((pr: Record<string, unknown>) =>
      this._mapPR(pr)
    );
  }

  async getPullRequest(
    owner: string,
    repo: string,
    number: number
  ): Promise<PullRequest> {
    const res = await this.octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      { owner, repo, pull_number: number }
    );
    return this._mapPR(res.data as Record<string, unknown>);
  }

  async getPRComments(
    owner: string,
    repo: string,
    number: number
  ): Promise<PRComment[]> {
    const res = await this.octokit.request(
      "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
      { owner, repo, issue_number: number, per_page: 100 }
    );
    return res.data.map((c: Record<string, unknown>) => ({
      id: c.id as number,
      body: c.body as string,
      author: {
        login: (c.user as { login: string }).login,
        avatarUrl: (c.user as { avatar_url: string }).avatar_url,
        id: (c.user as { id: number }).id,
      },
      createdAt: c.created_at as string,
      isTerminalCommand: ((c.body as string) || "")
        .trim()
        .startsWith("/terminal"),
    }));
  }

  async createComment(
    owner: string,
    repo: string,
    number: number,
    body: string
  ): Promise<void> {
    await this.octokit.request(
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
      { owner, repo, issue_number: number, body }
    );
  }

  async mergePR(
    owner: string,
    repo: string,
    number: number
  ): Promise<void> {
    await this.octokit.request(
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge",
      { owner, repo, pull_number: number, merge_method: "squash" }
    );
  }

  async createTag(
    owner: string,
    repo: string,
    tagName: string,
    sha: string
  ): Promise<void> {
    await this.octokit.request(
      "POST /repos/{owner}/{repo}/git/refs",
      { owner, repo, ref: `refs/tags/${tagName}`, sha }
    );
  }

  async getLatestCommit(
    owner: string,
    repo: string,
    branch: string
  ): Promise<string> {
    const res = await this.octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}",
      { owner, repo, ref: branch }
    );
    return (res.data as { sha: string }).sha;
  }

  async getCheckStatus(
    owner: string,
    repo: string,
    ref: string
  ): Promise<CheckStatus> {
    const res = await this.octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}/check-runs",
      { owner, repo, ref, per_page: 100 }
    );
    const runs = res.data.check_runs as Array<{ conclusion: string | null }>;
    const total = runs.length;
    const success = runs.filter(
      (r) => r.conclusion === "success"
    ).length;
    const failure = runs.filter(
      (r) => r.conclusion === "failure" || r.conclusion === "timed_out"
    ).length;
    const pending = runs.filter(
      (r) => r.conclusion === null
    ).length;

    let state: CheckStatus["state"] = "pending";
    if (total === 0) state = "pending";
    else if (failure > 0) state = "failure";
    else if (pending > 0) state = "pending";
    else state = "success";

    return {
      state,
      totalCount: total,
      successCount: success,
      failureCount: failure,
      pendingCount: pending,
    };
  }

  private _mapPR(pr: Record<string, unknown>): PullRequest {
    const head = pr.head as { ref: string };
    const base = pr.base as { ref: string };
    const user = pr.user as { login: string; avatar_url: string; id: number };
    return {
      number: pr.number as number,
      title: pr.title as string,
      body: (pr.body as string) || "",
      state: pr.state as "open" | "closed",
      merged: (pr.merged as boolean) || false,
      mergeable: pr.mergeable as boolean | null,
      headBranch: head.ref,
      baseBranch: base.ref,
      author: {
        login: user.login,
        avatarUrl: user.avatar_url,
        id: user.id,
      },
      createdAt: pr.created_at as string,
      updatedAt: pr.updated_at as string,
      checksStatus: null,
    };
  }
}
