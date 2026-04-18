import { GitHubClient } from "@terminal-mobile/shared";
import type { CommandContext } from "./index";

export async function handleScan(ctx: CommandContext): Promise<void> {
  const client = new GitHubClient(process.env.GITHUB_TOKEN || "");
  const [owner, repo] = ctx.repo.split("/");

  await client.createComment(owner, repo, ctx.issueNumber, [
    "🧪 `/terminal scan` (stub)",
    "",
    "- No real scan yet.",
    "- Hook into CI/security tools in v0.2+.",
    "",
  ].join("\n"));
}
