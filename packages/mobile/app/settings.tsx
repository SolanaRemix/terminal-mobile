import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("github_token");
    router.replace("/auth");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GITHUB ACCOUNT</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Disconnect GitHub</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SAFETY PREFERENCES</Text>
        <Text style={styles.note}>
          Dangerous commands (merge, tag) always require confirmation before execution.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <Text style={styles.note}>CyberAi Terminal v1.0.0 — SmartBrain / CyberAi</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d1117" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderBottomColor: "#30363d",
    borderBottomWidth: 1,
    backgroundColor: "#161b22",
  },
  back: { color: "#58a6ff", fontSize: 14 },
  title: { fontSize: 16, fontWeight: "600", color: "#e6edf3" },
  section: {
    backgroundColor: "#161b22",
    borderColor: "#30363d",
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6e7681",
    letterSpacing: 1,
    marginBottom: 12,
  },
  logoutBtn: {
    backgroundColor: "#b91c1c20",
    borderColor: "#b91c1c",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  logoutText: { color: "#f85149", fontSize: 14, fontWeight: "600" },
  note: { color: "#8b949e", fontSize: 13, lineHeight: 20 },
});
