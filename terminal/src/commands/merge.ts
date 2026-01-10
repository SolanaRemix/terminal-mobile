import { Octokit } from "@octokit/core";
import { CommandContext } from "./index";

export async function handleMerge(ctx: CommandContext) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repo] = ctx.repo.split("/");

  try {
    await octokit.request("PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge", {
      owner,
      repo,
      pull_number: ctx.issueNumber,
      merge_method: "squash"
    });

    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: ctx.issueNumber,
      body: "âœ… \/terminal merge\ completed â€” PR merged."
    });
  } catch (e) {
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: ctx.issueNumber,
      body: "âš ï¸ Merge failed. Check conflicts or branch protection."
    });
  }
}
