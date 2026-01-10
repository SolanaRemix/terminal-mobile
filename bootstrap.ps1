Param(
  [string]$ProjectName = "terminal"
)

Write-Host "Bootstrapping $ProjectName ..." -ForegroundColor Cyan

# Create root folder
New-Item -ItemType Directory -Force -Path $ProjectName | Out-Null
Set-Location $ProjectName

# Init npm
npm init -y | Out-Null

# Install deps
npm install @octokit/core @octokit/webhooks --save
npm install typescript ts-node @types/node --save-dev

# Update package.json
$pkg = Get-Content package.json | ConvertFrom-Json
$pkg.name = $ProjectName
$pkg.scripts = @{
  build = "tsc"
  dev   = "ts-node src/server.ts"
}
$pkg | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 package.json

# tsconfig.json
@"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
"@ | Out-File -Encoding UTF8 tsconfig.json

# Create folders
New-Item -ItemType Directory -Force -Path "src" | Out-Null
New-Item -ItemType Directory -Force -Path "src/commands" | Out-Null
New-Item -ItemType Directory -Force -Path ".github/workflows" | Out-Null
New-Item -ItemType Directory -Force -Path "docs" | Out-Null

# -------------------------
# SERVER (GitHub App)
# -------------------------
@"
import { Webhooks } from "@octokit/webhooks";
import { handleCommand } from "./commands";
import * as http from "http";

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET || "change-me"
});

webhooks.on("issue_comment.created", async ({ payload }) => {
  const body = payload.comment.body || "";
  const repo = payload.repository.full_name;
  const issueNumber = payload.issue.number;

  if (!body.trim().startsWith("/terminal")) return;

  console.log(\`[terminal] \${repo}#\${issueNumber}: \${body}\`);
  await handleCommand({ body, repo, issueNumber });
});

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/webhooks") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const id = req.headers["x-github-delivery"] as string;
        const name = req.headers["x-github-event"] as string;
        const signature = req.headers["x-hub-signature-256"] as string;

        await webhooks.verifyAndReceive({
          id,
          name,
          payload: body,
          signature
        });

        res.statusCode = 200;
        res.end("OK");
      } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end("Error");
      }
    });
  } else {
    res.statusCode = 200;
    res.end("CyberAi Terminal");
  }
});

server.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
"@ | Out-File -Encoding UTF8 "src/server.ts"

# -------------------------
# COMMAND ROUTER
# -------------------------
@"
import { handleHelp } from "./help";
import { handleMerge } from "./merge";
import { handleTag } from "./tag";
import { handleScan } from "./scan";
import { handleStatus } from "./status";

export type CommandContext = {
  body: string;
  repo: string;
  issueNumber: number;
};

export async function handleCommand(ctx: CommandContext) {
  const parts = ctx.body.trim().split(/\s+/);
  const [, subcommand, ...args] = parts;

  switch (subcommand) {
    case "help":
      return handleHelp(ctx);
    case "merge":
      return handleMerge(ctx);
    case "tag":
      return handleTag(ctx, args);
    case "scan":
      return handleScan(ctx);
    case "status":
      return handleStatus(ctx);
    default:
      return handleHelp(ctx);
  }
}
"@ | Out-File -Encoding UTF8 "src/commands/index.ts"

# -------------------------
# HELP COMMAND
# -------------------------
@"
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
      "### 🧪 /terminal help",
      "",
      "**Available commands:**",
      "- \`/terminal help\`",
      "- \`/terminal status\`",
      "- \`/terminal tag <name>\`",
      "- \`/terminal merge\`",
      "- \`/terminal scan\` (stub)",
      ""
    ].join("\n")
  });
}
"@ | Out-File -Encoding UTF8 "src/commands/help.ts"

# -------------------------
# TAG COMMAND
# -------------------------
@"
import { Octokit } from "@octokit/core";
import { CommandContext } from "./index";

export async function handleTag(ctx: CommandContext, args: string[]) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repo] = ctx.repo.split("/");

  const tagName = args[0];
  if (!tagName) {
    return octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: ctx.issueNumber,
      body: "⚠️ Usage: \`/terminal tag v0.1-dashboard\`"
    });
  }

  const latestCommit = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{branch}",
    { owner, repo, branch: "main" }
  );

  await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
    owner,
    repo,
    ref: \`refs/tags/\${tagName}\`,
    sha: latestCommit.data.sha
  });

  await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
    owner,
    repo,
    issue_number: ctx.issueNumber,
    body: \`🏷️ Tag created: \\\`\${tagName}\\\` on main\`
  });
}
"@ | Out-File -Encoding UTF8 "src/commands/tag.ts"

# -------------------------
# MERGE COMMAND
# -------------------------
@"
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
      body: "✅ \`/terminal merge\` completed — PR merged."
    });
  } catch (e) {
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: ctx.issueNumber,
      body: "⚠️ Merge failed. Check conflicts or branch protection."
    });
  }
}
"@ | Out-File -Encoding UTF8 "src/commands/merge.ts"

# -------------------------
# SCAN COMMAND
# -------------------------
@"
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
      "🧪 \`/terminal scan\` (stub)",
      "",
      "- No real scan yet.",
      "- Hook into CI/security tools in v0.2+.",
      ""
    ].join("\n")
  });
}
"@ | Out-File -Encoding UTF8 "src/commands/scan.ts"

# -------------------------
# STATUS COMMAND
# -------------------------
@"
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
      "📡 \`/terminal status\`",
      "",
      \`- State: \${pr.data.state}\`,
      \`- Merged: \${pr.data.merged}\`,
      ""
    ].join("\n")
  });
}
"@ | Out-File -Encoding UTF8 "src/commands/status.ts"

# -------------------------
# WORKFLOW
# -------------------------
@"
name: Terminal Engine

on:
  issue_comment:
    types: [created]

jobs:
  terminal:
    if: startsWith(github.event.comment.body, '/terminal scan')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Fake scan
        run: |
          echo 'Running fake scan...'
          echo 'All good.'
"@ | Out-File -Encoding UTF8 ".github/workflows/terminal.yml"

# -------------------------
# DOCS A–E
# -------------------------

# README.md
@"
# CyberAi Terminal

Control your repo from your phone using terminal-style commands inside GitHub PRs.

## Commands

\`\`\`
/terminal help
/terminal status
/terminal merge
/terminal tag <name>
/terminal scan
\`\`\`

## How it works

- GitHub App receives PR comments.
- \`/terminal\` commands are parsed.
- Safe actions are executed via GitHub API and Workflows.
- Results are posted back as PR comments.
"@ | Out-File -Encoding UTF8 "README.md"

# Marketplace
@"
# Marketplace Listing — GitHub Mobile Terminal

Short Description:
Run terminal-style commands directly inside GitHub PRs.

Long Description:
Mobile GitHub Terminal gives you a safe, command-driven interface inside GitHub pull requests.

Commands:
- /terminal help
- /terminal status
- /terminal merge
- /terminal tag
- /terminal scan

Pricing:
- Free: help, status, scan
- Pro: merge, tag
- Enterprise: SmartBrain AI
"@ | Out-File -Encoding UTF8 "docs/marketplace.md"

# Branding
@"
# Branding — CyberAi Terminal

Name: GitHub Mobile Terminal
Tagline: Control your repo from your phone.

Brand Architecture:
- Org: CyberAi
- Engine: SmartBrain
- Product: Terminal
"@ | Out-File -Encoding UTF8 "docs/branding.md"

# SmartBrain
@"
# SmartBrain Integration Plan

v0.1 — No AI required.
v0.2 — /terminal review, /terminal fix.
v1.0 — Multi-agent orchestration.
"@ | Out-File -Encoding UTF8 "docs/smartbrain.md"

# Org Structure
@"
# Org Structure — CyberAi + SmartBrain

CyberAi — Enterprise automation.
SmartBrain — AI engine.
Terminal — First product.
"@ | Out-File -Encoding UTF8 "docs/org-structure.md"

Write-Host "Bootstrap complete." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create GitHub App"
Write-Host "2. Point webhook to /webhooks"
Write-Host "3. Set GITHUB_TOKEN + WEBHOOK_SECRET"
Write-Host "4. Run: npm run build"
Write-Host "5. Comment /terminal help on a PR"
