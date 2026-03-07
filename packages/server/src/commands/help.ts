import { GitHubClient } from "@terminal-mobile/shared";
import type { CommandContext } from "./index";

export async function handleHelp(ctx: CommandContext): Promise<void> {
  const client = new GitHubClient(process.env.GITHUB_TOKEN || "");
  const [owner, repo] = ctx.repo.split("/");

  await client.createComment(owner, repo, ctx.issueNumber, [
    "### 🧪 /terminal help",
    "",
    "**Available commands:**",
    "- `/terminal help`",
    "- `/terminal status`",
    "- `/terminal tag <name>`",
    "- `/terminal merge`",
    "- `/terminal scan` (stub)",
    "",
  ].join("\n"));
}
