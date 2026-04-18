import { GitHubClient } from "@terminal-mobile/shared";
import type { CommandContext } from "./index";

export async function handleTag(ctx: CommandContext, args: string[]): Promise<void> {
  const client = new GitHubClient(process.env.GITHUB_TOKEN || "");
  const [owner, repo] = ctx.repo.split("/");

  const tagName = args[0];
  if (!tagName) {
    await client.createComment(
      owner,
      repo,
      ctx.issueNumber,
      "⚠️ Usage: `/terminal tag v0.1-dashboard`"
    );
    return;
  }

  const sha = await client.getLatestCommit(owner, repo, "main");

  await client.createTag(owner, repo, tagName, sha);

  await client.createComment(
    owner,
    repo,
    ctx.issueNumber,
    `🏷️ Tag created: \`${tagName}\` on main`
  );
}
