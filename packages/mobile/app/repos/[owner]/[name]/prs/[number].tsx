import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  GitHubClient,
  KNOWN_COMMANDS,
  parseCommand,
  getCommandRiskLevel,
} from "@terminal-mobile/shared";
import type { PullRequest, PRComment, CommandResult, TerminalCommand } from "@terminal-mobile/shared";

export default function PRDetailScreen() {
  const router = useRouter();
  const { owner, name, number } = useLocalSearchParams<{
    owner: string;
    name: string;
    number: string;
  }>();
  const prNumber = Number(number);

  const [pr, setPR] = useState<PullRequest | null>(null);
  const [comments, setComments] = useState<PRComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cmdInput, setCmdInput] = useState("");
  const [results, setResults] = useState<CommandResult[]>([]);
  const [suggestions, setSuggestions] = useState<typeof KNOWN_COMMANDS>([]);
  const [pendingCmd, setPendingCmd] = useState<TerminalCommand | null>(null);
  const [pendingExec, setPendingExec] = useState<null | (() => Promise<void>)>(null);
  const scrollRef = useRef<ScrollView>(null);

  const getClient = async () => {
    const token = await SecureStore.getItemAsync("github_token");
    if (!token) { router.replace("/auth"); return null; }
    return new GitHubClient(token);
  };

  const load = async () => {
    const client = await getClient();
    if (!client) return;
    try {
      const [prData, commentData] = await Promise.all([
        client.getPullRequest(owner!, name!, prNumber),
        client.getPRComments(owner!, name!, prNumber),
      ]);
      setPR(prData);
      setComments(commentData);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to load PR");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [owner, name, prNumber]);

  const handleInputChange = (text: string) => {
    setCmdInput(text);
    if (text.startsWith("/terminal")) {
      const typed = text.toLowerCase();
      setSuggestions(
        KNOWN_COMMANDS.filter((c) =>
          `/terminal ${c.name}`.startsWith(typed) || typed === "/terminal"
        )
      );
    } else {
      setSuggestions([]);
    }
  };

  const executeCommand = async (cmd: TerminalCommand) => {
    const client = await getClient();
    if (!client) return;
    if (cmd.name === "merge") {
      await client.mergePR(owner!, name!, prNumber);
    } else if (cmd.name === "tag") {
      const tagName = cmd.args[0];
      if (!tagName) throw new Error("Tag name required: /terminal tag <name>");
      const sha = await client.getLatestCommit(owner!, name!, pr?.baseBranch ?? "main");
      await client.createTag(owner!, name!, tagName, sha);
    } else if (cmd.name === "status") {
      await load();
    }
  };

  const handleSubmit = async () => {
    const cmd = parseCommand(cmdInput);
    if (!cmd) {
      Alert.alert("Unknown command", `"${cmdInput}" is not a valid /terminal command.`);
      return;
    }
    setCmdInput("");
    setSuggestions([]);

    const risk = getCommandRiskLevel(cmd.name);
    if (risk === "dangerous" || risk === "moderate") {
      setPendingCmd(cmd);
      setPendingExec(() => () => executeCommand(cmd));
      return;
    }

    try {
      await executeCommand(cmd);
      setResults((r) => [
        ...r,
        {
          command: cmd,
          success: true,
          message: "Command executed successfully.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setResults((r) => [
        ...r,
        {
          command: cmd,
          success: false,
          message: e instanceof Error ? e.message : "Command failed.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const confirmExec = async () => {
    if (!pendingCmd || !pendingExec) return;
    try {
      await pendingExec();
      setResults((r) => [
        ...r,
        {
          command: pendingCmd,
          success: true,
          message: "Command executed successfully.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setResults((r) => [
        ...r,
        {
          command: pendingCmd,
          success: false,
          message: e instanceof Error ? e.message : "Command failed.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    setPendingCmd(null);
    setPendingExec(null);
  };

  const stateColor = pr?.merged ? "#a371f7" : pr?.state === "open" ? "#3fb950" : "#f85149";
  const stateLabel = pr?.merged ? "merged" : pr?.state ?? "";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← PRs</Text>
        </TouchableOpacity>
        {pr && (
          <>
            <Text style={styles.prNum}>#{pr.number}</Text>
            <Text style={[styles.stateBadge, { color: stateColor, borderColor: stateColor }]}>
              {stateLabel}
            </Text>
          </>
        )}
      </View>

      <ScrollView style={styles.scroll} ref={scrollRef}>
        {pr && (
          <View style={styles.prInfo}>
            <Text style={styles.prTitle}>{pr.title}</Text>
            <View style={styles.branchRow}>
              <Text style={styles.branch}>{pr.headBranch}</Text>
              <Text style={styles.arrow}> → </Text>
              <Text style={styles.branch}>{pr.baseBranch}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>COMMENTS</Text>
        {comments.map((c) => (
          <View key={c.id} style={[styles.comment, c.isTerminalCommand && styles.terminalComment]}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{c.author.login}</Text>
              {c.isTerminalCommand && (
                <Text style={styles.terminalBadge}>terminal</Text>
              )}
            </View>
            <Text style={styles.commentBody}>{c.body}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>TERMINAL</Text>
        <View style={styles.terminal}>
          {results.map((r, i) => (
            <View key={i} style={[styles.resultEntry, r.success ? styles.successEntry : styles.errorEntry]}>
              <Text style={styles.prompt}>$ /terminal {r.command.name}{r.command.args.length > 0 ? ` ${r.command.args.join(" ")}` : ""}</Text>
              <Text style={styles.resultMsg}>{r.message}</Text>
              <Text style={styles.timestamp}>{new Date(r.timestamp).toLocaleTimeString()}</Text>
            </View>
          ))}
          {results.length === 0 && (
            <Text style={styles.terminalEmpty}>No commands run yet.</Text>
          )}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s.name}
                style={styles.suggestionItem}
                onPress={() => { setCmdInput(`/terminal ${s.name}`); setSuggestions([]); }}
              >
                <Text style={styles.suggestCmd}>/terminal {s.name}</Text>
                <Text style={styles.suggestDesc}>{s.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <Text style={styles.dollar}>$</Text>
        <TextInput
          style={styles.cmdInput}
          value={cmdInput}
          onChangeText={handleInputChange}
          placeholder="/terminal help"
          placeholderTextColor="#6e7681"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.runBtn} onPress={handleSubmit}>
          <Text style={styles.runBtnText}>Run</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!pendingCmd} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Confirm: /terminal {pendingCmd?.name}
            </Text>
            <Text style={styles.modalMsg}>
              {pendingCmd?.name === "merge"
                ? `Squash-merge PR #${prNumber} into ${pr?.baseBranch ?? "main"}?`
                : pendingCmd?.name === "tag"
                ? `Create tag "${pendingCmd.args[0]}" on ${pr?.baseBranch ?? "main"}?`
                : `Run /terminal ${pendingCmd?.name}?`}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setPendingCmd(null); setPendingExec(null); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, pendingCmd?.name === "merge" && styles.dangerBtn]}
                onPress={confirmExec}
              >
                <Text style={styles.confirmBtnText}>Yes, proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d1117" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomColor: "#30363d",
    borderBottomWidth: 1,
    backgroundColor: "#161b22",
  },
  back: { color: "#58a6ff", fontSize: 14 },
  prNum: { fontFamily: "monospace", color: "#6e7681", fontSize: 13 },
  stateBadge: {
    fontSize: 11, fontWeight: "700",
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 9999, borderWidth: 1, textTransform: "capitalize",
  },
  scroll: { flex: 1 },
  prInfo: { padding: 16, borderBottomColor: "#30363d", borderBottomWidth: 1 },
  prTitle: { fontSize: 17, fontWeight: "700", color: "#e6edf3", marginBottom: 8 },
  branchRow: { flexDirection: "row", alignItems: "center" },
  branch: {
    fontFamily: "monospace", fontSize: 12, color: "#58a6ff",
    backgroundColor: "#21262d", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  arrow: { color: "#6e7681", marginHorizontal: 4 },
  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: "#6e7681",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    letterSpacing: 1,
  },
  comment: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: "#161b22", borderColor: "#30363d",
    borderWidth: 1, borderRadius: 8, padding: 12,
  },
  terminalComment: { borderColor: "#39d35340", backgroundColor: "#39d35308" },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { color: "#e6edf3", fontSize: 13, fontWeight: "600" },
  terminalBadge: {
    fontSize: 10, color: "#39d353", fontFamily: "monospace",
    backgroundColor: "#39d35320", paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 9999, borderColor: "#39d35350", borderWidth: 1,
  },
  commentBody: { color: "#8b949e", fontSize: 13, lineHeight: 19 },
  terminal: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: "#0d1117", borderColor: "#30363d",
    borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 100,
  },
  resultEntry: {
    marginBottom: 10, paddingLeft: 8,
    borderLeftWidth: 3, borderLeftColor: "#30363d", borderRadius: 2,
  },
  successEntry: { borderLeftColor: "#39d353" },
  errorEntry: { borderLeftColor: "#f85149" },
  prompt: { fontFamily: "monospace", color: "#39d353", fontSize: 12, fontWeight: "700" },
  resultMsg: { color: "#e6edf3", fontSize: 12, marginTop: 2 },
  timestamp: { color: "#6e7681", fontSize: 11, marginTop: 2 },
  terminalEmpty: { color: "#6e7681", fontSize: 12, fontFamily: "monospace" },
  suggestions: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: "#161b22", borderColor: "#30363d",
    borderWidth: 1, borderRadius: 8, overflow: "hidden",
  },
  suggestionItem: {
    padding: 10, borderBottomColor: "#30363d", borderBottomWidth: 1,
  },
  suggestCmd: { fontFamily: "monospace", color: "#39d353", fontSize: 13 },
  suggestDesc: { color: "#8b949e", fontSize: 12, marginTop: 2 },
  inputArea: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#161b22", borderTopColor: "#30363d",
    borderTopWidth: 1, padding: 12, gap: 8,
  },
  dollar: { fontFamily: "monospace", color: "#39d353", fontWeight: "700", fontSize: 16 },
  cmdInput: {
    flex: 1, fontFamily: "monospace", fontSize: 14,
    color: "#e6edf3", padding: 0,
  },
  runBtn: {
    backgroundColor: "#1f6feb", borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  runBtnText: { color: "#e6edf3", fontSize: 13, fontWeight: "600" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center", justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#161b22", borderColor: "#30363d",
    borderWidth: 1, borderRadius: 12, padding: 24, width: "85%",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#e6edf3", marginBottom: 12 },
  modalMsg: { color: "#8b949e", fontSize: 14, lineHeight: 22, marginBottom: 24 },
  modalActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  cancelBtn: {
    backgroundColor: "#21262d", borderColor: "#30363d", borderWidth: 1,
    borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8,
  },
  cancelBtnText: { color: "#e6edf3", fontSize: 14 },
  confirmBtn: {
    backgroundColor: "#1f6feb", borderRadius: 6,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  dangerBtn: { backgroundColor: "#b91c1c" },
  confirmBtnText: { color: "#e6edf3", fontSize: 14, fontWeight: "600" },
});
