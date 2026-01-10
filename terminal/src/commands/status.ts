import { Octokit } from "@octokit/core";
import { CommandContext } from "./index";

export async function handleStatus(ctx: CommandContext) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repo] = ctx.repo.split("/");

  const pr = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    { owner, repo, pull_number: ctx.issueNumber }
  );

  await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
    owner,
    repo,
    issue_number: ctx.issueNumber,
    body: [
      "ðŸ“¡ \/terminal status\",
      "",
      \- State: \\,
      \- Merged: \\,
      ""
    ].join("\n")
  });
}
