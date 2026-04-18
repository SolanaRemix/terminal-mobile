import { GitHubClient } from "@terminal-mobile/shared";
import type { CommandContext } from "./index";

export async function handleMerge(ctx: CommandContext): Promise<void> {
  const client = new GitHubClient(process.env.GITHUB_TOKEN || "");
  const [owner, repo] = ctx.repo.split("/");

  try {
    await client.mergePR(owner, repo, ctx.issueNumber);
    await client.createComment(
      owner,
      repo,
      ctx.issueNumber,
      "✅ `/terminal merge` completed — PR merged."
    );
  } catch {
    await client.createComment(
      owner,
      repo,
      ctx.issueNumber,
      "⚠️ Merge failed. Check conflicts or branch protection."
    );
  }
}
