import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { GitHubClient } from "@terminal-mobile/shared";

const TOKEN_KEY = "github_token";

export default function AuthScreen() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      const client = new GitHubClient(token.trim());
      await client.getUser();
      await SecureStore.setItemAsync(TOKEN_KEY, token.trim());
      router.replace("/repos");
    } catch {
      Alert.alert("Error", "Invalid token or GitHub API error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>⬡ CyberAi Terminal</Text>
      <Text style={styles.heading}>Connect GitHub</Text>
      <Text style={styles.desc}>
        Enter a GitHub Personal Access Token with{" "}
        <Text style={styles.code}>repo</Text> and{" "}
        <Text style={styles.code}>read:user</Text> scopes.
      </Text>
      <TextInput
        style={styles.input}
        value={token}
        onChangeText={setToken}
        placeholder="ghp_..."
        placeholderTextColor="#6e7681"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={[styles.button, (!token.trim() || loading) && styles.buttonDisabled]}
        onPress={handleConnect}
        disabled={!token.trim() || loading}
      >
        <Text style={styles.buttonText}>{loading ? "Connecting…" : "Connect"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => Linking.openURL("https://github.com/settings/tokens/new")}
      >
        <Text style={styles.link}>Generate a new token →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1117",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontFamily: "monospace",
    color: "#39d353",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#e6edf3",
    marginBottom: 8,
  },
  desc: {
    color: "#8b949e",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  code: {
    fontFamily: "monospace",
    color: "#58a6ff",
    backgroundColor: "#21262d",
  },
  input: {
    backgroundColor: "#161b22",
    borderColor: "#30363d",
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    color: "#e6edf3",
    fontFamily: "monospace",
    fontSize: 14,
    width: "100%",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#238636",
    borderRadius: 6,
    padding: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#e6edf3",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    color: "#58a6ff",
    fontSize: 14,
  },
});
