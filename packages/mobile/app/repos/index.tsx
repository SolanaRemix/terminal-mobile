import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { GitHubClient } from "@terminal-mobile/shared";
import type { Repository } from "@terminal-mobile/shared";

export default function ReposScreen() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const token = await SecureStore.getItemAsync("github_token");
      if (!token) { router.replace("/auth"); return; }
      const client = new GitHubClient(token);
      const data = await client.listRepos();
      setRepos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>⬡ CyberAi Terminal</Text>
        <Text style={styles.heading}>Repositories</Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={repos}
        keyExtractor={(r) => r.fullName}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor="#39d353"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.repoItem}
            onPress={() => router.push(`/repos/${item.owner}/${item.name}/prs`)}
          >
            <Text style={styles.repoName}>{item.fullName}</Text>
            <View style={styles.meta}>
              <Text style={styles.branch}>{item.defaultBranch}</Text>
              {item.private && <Text style={styles.private}>private</Text>}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1117",
  },
  header: {
    borderBottomColor: "#30363d",
    borderBottomWidth: 1,
    backgroundColor: "#161b22",
    padding: 16,
  },
  logo: {
    fontFamily: "monospace",
    color: "#39d353",
    fontSize: 14,
    marginBottom: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e6edf3",
  },
  list: {
    padding: 16,
    gap: 8,
  },
  repoItem: {
    backgroundColor: "#161b22",
    borderColor: "#30363d",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  repoName: {
    color: "#e6edf3",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  meta: {
    flexDirection: "row",
    gap: 8,
  },
  branch: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#8b949e",
    backgroundColor: "#21262d",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  private: {
    fontSize: 12,
    color: "#e3b341",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderColor: "#9e6a03",
    borderWidth: 1,
  },
  error: {
    color: "#f85149",
    padding: 16,
  },
});
