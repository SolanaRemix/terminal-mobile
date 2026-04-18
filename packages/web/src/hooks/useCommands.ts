import { useState, useCallback } from "react";
import {
  parseCommand,
  getCommandRiskLevel,
  type TerminalCommand,
  type CommandResult,
} from "@terminal-mobile/shared";

export interface UseCommandsReturn {
  history: CommandResult[];
  pendingCommand: TerminalCommand | null;
  parseInput: (input: string) => TerminalCommand | null;
  confirmCommand: (cmd: TerminalCommand, execute: () => Promise<void>) => Promise<void>;
  cancelCommand: () => void;
  addResult: (result: CommandResult) => void;
}

export function useCommands(): UseCommandsReturn {
  const [history, setHistory] = useState<CommandResult[]>([]);
  const [pendingCommand, setPendingCommand] = useState<TerminalCommand | null>(null);

  const parseInput = useCallback((input: string): TerminalCommand | null => {
    return parseCommand(input);
  }, []);

  const confirmCommand = useCallback(
    async (cmd: TerminalCommand, execute: () => Promise<void>) => {
      const risk = getCommandRiskLevel(cmd.name);
      if (risk === "dangerous" || risk === "moderate") {
        setPendingCommand(cmd);
      } else {
        try {
          await execute();
          const result: CommandResult = {
            command: cmd,
            success: true,
            message: "Command executed successfully.",
            timestamp: new Date().toISOString(),
          };
          setHistory((h) => [...h, result]);
        } catch (err) {
          const result: CommandResult = {
            command: cmd,
            success: false,
            message: err instanceof Error ? err.message : "Unknown error",
            timestamp: new Date().toISOString(),
          };
          setHistory((h) => [...h, result]);
        }
      }
    },
    []
  );

  const cancelCommand = useCallback(() => setPendingCommand(null), []);

  const addResult = useCallback((result: CommandResult) => {
    setHistory((h) => [...h, result]);
    setPendingCommand(null);
  }, []);

  return { history, pendingCommand, parseInput, confirmCommand, cancelCommand, addResult };
}
