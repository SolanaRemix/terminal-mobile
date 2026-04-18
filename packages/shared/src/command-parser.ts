import type { CommandName, TerminalCommand } from "./models";

export interface CommandMeta {
  name: CommandName;
  description: string;
  usage: string;
  riskLevel: "safe" | "moderate" | "dangerous";
}

export const KNOWN_COMMANDS: CommandMeta[] = [
  {
    name: "help",
    description: "Show available commands and usage",
    usage: "/terminal help",
    riskLevel: "safe",
  },
  {
    name: "status",
    description: "Show current PR state, merge status, and CI checks",
    usage: "/terminal status",
    riskLevel: "safe",
  },
  {
    name: "scan",
    description: "Run a security/CI scan on the PR (stub)",
    usage: "/terminal scan",
    riskLevel: "safe",
  },
  {
    name: "tag",
    description: "Create a git tag on the default branch",
    usage: "/terminal tag <name>",
    riskLevel: "moderate",
  },
  {
    name: "merge",
    description: "Squash-merge this PR into the base branch",
    usage: "/terminal merge",
    riskLevel: "dangerous",
  },
];

const KNOWN_COMMAND_NAMES = new Set<CommandName>(
  KNOWN_COMMANDS.map((c) => c.name)
);

export function isTerminalCommand(text: string): boolean {
  return text.trim().startsWith("/terminal");
}

export function parseCommand(input: string): TerminalCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/terminal")) return null;

  const parts = trimmed.split(/\s+/);
  // parts[0] == "/terminal", parts[1] == subcommand, rest == args
  const subcommand = parts[1] as CommandName | undefined;

  if (!subcommand) {
    // bare "/terminal" defaults to help
    return {
      name: "help",
      args: [],
      rawInput: input,
    };
  }

  if (!KNOWN_COMMAND_NAMES.has(subcommand)) {
    return null;
  }

  return {
    name: subcommand,
    args: parts.slice(2),
    rawInput: input,
  };
}

export function getCommandHelp(name: CommandName | string): string {
  const meta = KNOWN_COMMANDS.find((c) => c.name === name);
  if (!meta) return `Unknown command: ${name}`;
  return `**${meta.usage}** — ${meta.description} (risk: ${meta.riskLevel})`;
}

export function getCommandRiskLevel(
  name: CommandName | string
): "safe" | "moderate" | "dangerous" {
  const meta = KNOWN_COMMANDS.find((c) => c.name === name);
  return meta?.riskLevel ?? "safe";
}
