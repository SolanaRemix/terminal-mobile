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
