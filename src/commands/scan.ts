import { Octokit } from "@octokit/core";
import { CommandContext } from "./index";

export async function handleScan(ctx: CommandContext) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repo] = ctx.repo.split("/");

  await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
    owner,
    repo,
    issue_number: ctx.issueNumber,
    body: [
      "ðŸ§ª \/terminal scan\ (stub)",
      "",
      "- No real scan yet.",
      "- Hook into CI/security tools in v0.2+.",
      ""
    ].join("\n")
  });
}
