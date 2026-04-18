import { GitHubClient } from "@terminal-mobile/shared";
import type { CommandContext } from "./index";

export async function handleStatus(ctx: CommandContext): Promise<void> {
  const client = new GitHubClient(process.env.GITHUB_TOKEN || "");
  const [owner, repo] = ctx.repo.split("/");

  const pr = await client.getPullRequest(owner, repo, ctx.issueNumber);

  await client.createComment(owner, repo, ctx.issueNumber, [
    "📡 `/terminal status`",
    "",
    `- State: ${pr.state}`,
    `- Merged: ${pr.merged}`,
    `- Mergeable: ${pr.mergeable ?? "unknown"}`,
    `- Head branch: ${pr.headBranch}`,
    `- Base branch: ${pr.baseBranch}`,
    "",
  ].join("\n"));
}
