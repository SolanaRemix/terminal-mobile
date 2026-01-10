import { Octokit } from "@octokit/core";
import { CommandContext } from "./index";

export async function handleHelp(ctx: CommandContext) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repo] = ctx.repo.split("/");

  await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
    owner,
    repo,
    issue_number: ctx.issueNumber,
    body: [
      "### ðŸ§ª /terminal help",
      "",
      "**Available commands:**",
      "- \/terminal help\",
      "- \/terminal status\",
      "- \/terminal tag <name>\",
      "- \/terminal merge\",
      "- \/terminal scan\ (stub)",
      ""
    ].join("\n")
  });
}
