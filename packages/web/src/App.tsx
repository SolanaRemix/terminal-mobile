import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AuthScreen } from "./screens/AuthScreen";
import { RepoListScreen } from "./screens/RepoListScreen";
import { PRListScreen } from "./screens/PRListScreen";
import { PRDetailScreen } from "./screens/PRDetailScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/repos" element={<RepoListScreen />} />
          <Route path="/repos/:owner/:name/prs" element={<PRListScreen />} />
          <Route path="/repos/:owner/:name/prs/:number" element={<PRDetailScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
