# CyberAi Terminal

Control your repo from your phone using terminal-style commands inside GitHub PRs.

## Commands

\\\
/terminal help
/terminal status
/terminal merge
/terminal tag <name>
/terminal scan
\\\

## How it works

- GitHub App receives PR comments.
- \/terminal\ commands are parsed.
- Safe actions are executed via GitHub API and Workflows.
- Results are posted back as PR comments.
