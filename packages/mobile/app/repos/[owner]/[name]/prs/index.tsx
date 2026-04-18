import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { GitHubClient } from "@terminal-mobile/shared";
import type { PullRequest } from "@terminal-mobile/shared";

export default function PRListScreen() {
  const router = useRouter();
  const { owner, name } = useLocalSearchParams<{ owner: string; name: string }>();
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const token = await SecureStore.getItemAsync("github_token");
      if (!token) { router.replace("/auth"); return; }
      const client = new GitHubClient(token);
      const data = await client.listPullRequests(owner!, name!);
      setPRs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PRs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [owner, name]);

  const getStateColor = (pr: PullRequest) => {
    if (pr.merged) return "#a371f7";
    return pr.state === "open" ? "#3fb950" : "#f85149";
  };

  const getStateLabel = (pr: PullRequest) => {
    if (pr.merged) return "merged";
    return pr.state;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Repos</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{owner}/{name}</Text>
      </View>
      <Text style={styles.heading}>Open Pull Requests</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={prs}
        keyExtractor={(pr) => String(pr.number)}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor="#39d353" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.prItem}
            onPress={() => router.push(`/repos/${owner}/${name}/prs/${item.number}`)}
          >
            <View style={styles.prHeader}>
              <Text style={styles.prNum}>#{item.number}</Text>
              <Text style={[styles.stateBadge, { color: getStateColor(item), borderColor: getStateColor(item) }]}>
                {getStateLabel(item)}
              </Text>
            </View>
            <Text style={styles.prTitle}>{item.title}</Text>
            <View style={styles.prMeta}>
              <Text style={styles.prBranch}>{item.headBranch} → {item.baseBranch}</Text>
              <Text style={styles.prAuthor}>by {item.author.login}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No open pull requests.</Text> : null
        }
      />
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
  title: { fontFamily: "monospace", color: "#e6edf3", fontSize: 14, fontWeight: "600" },
  heading: { fontSize: 18, fontWeight: "700", color: "#e6edf3", padding: 16, paddingBottom: 8 },
  list: { padding: 16, gap: 8 },
  prItem: {
    backgroundColor: "#161b22",
    borderColor: "#30363d",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  prHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  prNum: { fontFamily: "monospace", color: "#6e7681", fontSize: 13 },
  stateBadge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    textTransform: "capitalize",
  },
  prTitle: { color: "#e6edf3", fontSize: 15, fontWeight: "600", marginBottom: 8 },
  prMeta: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  prBranch: { fontFamily: "monospace", fontSize: 12, color: "#8b949e" },
  prAuthor: { fontSize: 12, color: "#6e7681" },
  error: { color: "#f85149", padding: 16 },
  empty: { color: "#6e7681", fontSize: 14, textAlign: "center", marginTop: 32 },
});
